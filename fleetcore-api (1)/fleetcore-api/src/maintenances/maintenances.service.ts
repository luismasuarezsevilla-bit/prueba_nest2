import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, LessThan, MoreThan, Repository } from 'typeorm';
import { ActiveStatus, MaintenanceStatus, Role, VehicleStatus } from '../common/enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { Mechanic } from '../mechanics/mechanic.entity';
import { User } from '../users/user.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Workshop } from '../workshops/workshop.entity';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { MaintenanceStatusLog } from './maintenance-status-log.entity';
import { assertTransition } from './maintenance-state-machine';
import { Maintenance } from './maintenance.entity';

/** Estados que cuentan como "mantenimiento activo". */
const ACTIVE_STATUSES = [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS];
const RELATIONS = { vehicle: true, mechanic: true, workshop: true } as const;

@Injectable()
export class MaintenancesService {
  constructor(
    @InjectRepository(Maintenance) private readonly maintenances: Repository<Maintenance>,
    @InjectRepository(MaintenanceStatusLog) private readonly logs: Repository<MaintenanceStatusLog>,
    @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
    @InjectRepository(Mechanic) private readonly mechanics: Repository<Mechanic>,
    private readonly dataSource: DataSource,
  ) {}

  // =====================================================================
  // CREAR
  // =====================================================================
  /**
   * TRANSACCIÓN: crear el mantenimiento y su registro de auditoría es atómico.
   * Se bloquean (pessimistic_write) las filas del vehículo y del mecánico para que dos
   * peticiones simultáneas no puedan agendar horarios cruzados (condición de carrera).
   */
  async create(dto: CreateMaintenanceDto, user: AuthUser) {
    const start = new Date(dto.scheduledStart);
    const end = new Date(dto.scheduledEnd);
    if (end <= start) {
      throw new BadRequestException('scheduledEnd debe ser posterior a scheduledStart');
    }

    const id = await this.dataSource.transaction(async (manager) => {
      const vehicle = await manager.findOne(Vehicle, {
        where: { id: dto.vehicleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!vehicle) throw new NotFoundException(`El vehículo con id ${dto.vehicleId} no existe`);
      if (vehicle.status === VehicleStatus.INACTIVE) {
        throw new ConflictException(
          `El vehículo ${vehicle.plate} está INACTIVE y no puede tener nuevos mantenimientos`,
        );
      }

      const mechanic = await manager.findOne(Mechanic, {
        where: { id: dto.mechanicId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!mechanic) throw new NotFoundException(`El mecánico con id ${dto.mechanicId} no existe`);
      if (mechanic.status !== ActiveStatus.ACTIVE) {
        throw new ConflictException(`El mecánico ${mechanic.name} está inactivo y no puede ser asignado`);
      }

      const workshop = await manager.findOne(Workshop, { where: { id: dto.workshopId } });
      if (!workshop) throw new NotFoundException(`El taller con id ${dto.workshopId} no existe`);
      if (workshop.status !== ActiveStatus.ACTIVE) {
        throw new ConflictException(`El taller ${workshop.name} está inactivo y no puede recibir mantenimientos`);
      }

      if (dto.mileage < vehicle.mileage) {
        throw new BadRequestException(
          `El kilometraje (${dto.mileage}) no puede ser inferior al actual del vehículo (${vehicle.mileage})`,
        );
      }

      // Cruce de horarios: dos rangos se cruzan si startA < endB && endA > startB.
      // Así 7:30-9:00 y 9:00-10:30 NO se cruzan (permitido), pero 7:30-9:00 y 8:00-9:30 sí.
      // Aplica al mecánico (en cualquier taller) y al vehículo.
      const mechanicClash = await manager.findOne(Maintenance, {
        where: {
          mechanic: { id: mechanic.id },
          status: In(ACTIVE_STATUSES),
          scheduledStart: LessThan(end),
          scheduledEnd: MoreThan(start),
        },
      });
      if (mechanicClash) {
        throw new ConflictException(
          `El mecánico ${mechanic.name} ya tiene un mantenimiento activo que se cruza con ese horario (mantenimiento #${mechanicClash.id})`,
        );
      }

      const vehicleClash = await manager.findOne(Maintenance, {
        where: {
          vehicle: { id: vehicle.id },
          status: In(ACTIVE_STATUSES),
          scheduledStart: LessThan(end),
          scheduledEnd: MoreThan(start),
        },
      });
      if (vehicleClash) {
        throw new ConflictException(
          `El vehículo ${vehicle.plate} ya tiene un mantenimiento activo en ese horario (mantenimiento #${vehicleClash.id})`,
        );
      }

      const saved = await manager.save(
        manager.create(Maintenance, {
          type: dto.type,
          description: dto.description,
          mileage: dto.mileage,
          scheduledStart: start,
          scheduledEnd: end,
          status: MaintenanceStatus.SCHEDULED, // estado inicial fijo
          vehicle,
          mechanic,
          workshop,
        }),
      );
      await this.writeLog(manager, saved, null, MaintenanceStatus.SCHEDULED, user);
      return saved.id;
    });

    return this.getById(id);
  }

  // =====================================================================
  // CAMBIAR ESTADO
  // =====================================================================
  /**
   * TRANSACCIÓN: cambio de estado + actualización del vehículo + auditoría, todo o nada.
   * Se bloquea la fila del mantenimiento y la del vehículo para serializar cambios concurrentes.
   */
  async updateStatus(id: number, dto: UpdateMaintenanceStatusDto, user: AuthUser) {
    await this.dataSource.transaction(async (manager) => {
      const locked = await manager.findOne(Maintenance, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) throw new NotFoundException(`El mantenimiento con id ${id} no existe`);

      const maintenance = await manager.findOneOrFail(Maintenance, { where: { id }, relations: RELATIONS });
      const vehicle = await manager.findOneOrFail(Vehicle, {
        where: { id: maintenance.vehicle.id },
        lock: { mode: 'pessimistic_write' },
      });

      // Un TECHNICIAN solo puede operar sobre mantenimientos de su propio mecánico
      await this.assertTechnicianOwnsMaintenance(manager, maintenance, user);

      const from = maintenance.status;
      const to = dto.status;
      assertTransition(from, to);

      switch (to) {
        case MaintenanceStatus.IN_PROGRESS: {
          if (vehicle.status === VehicleStatus.INACTIVE) {
            throw new ConflictException(`El vehículo ${vehicle.plate} está INACTIVE`);
          }
          // Un vehículo no puede tener dos mantenimientos en proceso a la vez
          const other = await manager.findOne(Maintenance, {
            where: { vehicle: { id: vehicle.id }, status: MaintenanceStatus.IN_PROGRESS },
          });
          if (other) {
            throw new ConflictException(
              `El vehículo ${vehicle.plate} ya tiene un mantenimiento en proceso (#${other.id})`,
            );
          }
          vehicle.status = VehicleStatus.IN_MAINTENANCE; // regla: IN_PROGRESS => IN_MAINTENANCE
          break;
        }

        case MaintenanceStatus.COMPLETED: {
          // Sin la información de cierre completa no se puede completar
          const missing = (
            [
              ['workDone', dto.workDone],
              ['finalCost', dto.finalCost],
              ['finishedAt', dto.finishedAt],
              ['finalMileage', dto.finalMileage],
            ] as const
          )
            .filter(([, value]) => value === undefined || value === null || value === '')
            .map(([name]) => name);
          if (missing.length > 0) {
            throw new BadRequestException(
              `Para completar el mantenimiento faltan los datos de cierre: ${missing.join(', ')}`,
            );
          }
          if (dto.finalMileage! < Math.max(maintenance.mileage, vehicle.mileage)) {
            throw new BadRequestException(
              `El kilometraje final (${dto.finalMileage}) no puede ser inferior al registrado (${Math.max(maintenance.mileage, vehicle.mileage)})`,
            );
          }
          maintenance.workDone = dto.workDone!;
          maintenance.finalCost = dto.finalCost!;
          maintenance.finishedAt = new Date(dto.finishedAt!);
          maintenance.finalMileage = dto.finalMileage!;
          vehicle.mileage = dto.finalMileage!; // el vehículo queda con el kilometraje final
          // regla: COMPLETED => AVAILABLE (salvo que el vehículo se haya inactivado)
          if (vehicle.status === VehicleStatus.IN_MAINTENANCE) vehicle.status = VehicleStatus.AVAILABLE;
          break;
        }

        case MaintenanceStatus.CANCELLED: {
          // Si estaba en proceso, el vehículo vuelve a quedar disponible
          if (from === MaintenanceStatus.IN_PROGRESS && vehicle.status === VehicleStatus.IN_MAINTENANCE) {
            vehicle.status = VehicleStatus.AVAILABLE;
          }
          break;
        }
      }

      maintenance.status = to;
      await manager.save(Vehicle, vehicle);
      await manager.save(Maintenance, maintenance);
      await this.writeLog(manager, maintenance, from, to, user);
    });

    return this.getById(id);
  }

  // =====================================================================
  // CONSULTAS
  // =====================================================================
  findAll() {
    return this.maintenances.find({ relations: RELATIONS, order: { scheduledStart: 'DESC' } });
  }

  findActive() {
    return this.maintenances.find({
      where: { status: In(ACTIVE_STATUSES) },
      relations: RELATIONS,
      order: { scheduledStart: 'ASC' },
    });
  }

  async findByVehicle(vehicleId: number) {
    await this.assertVehicleExists(vehicleId);
    return this.maintenances.find({
      where: { vehicle: { id: vehicleId } },
      relations: RELATIONS,
      order: { scheduledStart: 'DESC' },
    });
  }

  /** Historial = mantenimientos ya cerrados (COMPLETED o CANCELLED), del más reciente al más antiguo. */
  async findHistoryByVehicle(vehicleId: number) {
    await this.assertVehicleExists(vehicleId);
    return this.maintenances.find({
      where: {
        vehicle: { id: vehicleId },
        status: In([MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED]),
      },
      relations: RELATIONS,
      order: { scheduledStart: 'DESC' },
    });
  }

  async findByMechanic(mechanicId: number) {
    if (!(await this.mechanics.findOne({ where: { id: mechanicId } }))) {
      throw new NotFoundException(`El mecánico con id ${mechanicId} no existe`);
    }
    return this.maintenances.find({
      where: { mechanic: { id: mechanicId } },
      relations: RELATIONS,
      order: { scheduledStart: 'DESC' },
    });
  }

  /** Mantenimientos asignados al TECHNICIAN autenticado (con vehículo y taller donde debe realizarlos). */
  async findMine(user: AuthUser) {
    const mechanic = await this.mechanics.findOne({ where: { user: { id: user.id } } });
    if (!mechanic) return [];
    return this.maintenances.find({
      where: { mechanic: { id: mechanic.id } },
      relations: RELATIONS,
      order: { scheduledStart: 'ASC' },
    });
  }

  async findOne(id: number, user: AuthUser) {
    const maintenance = await this.getById(id);
    await this.assertTechnicianOwnsMaintenance(this.dataSource.manager, maintenance, user);
    return maintenance;
  }

  /** Auditoría: historial de cambios de estado (de un mantenimiento o de todos). */
  async findAuditLogs(maintenanceId?: number) {
    if (maintenanceId !== undefined) await this.getById(maintenanceId);
    return this.logs.find({
      where: maintenanceId !== undefined ? { maintenance: { id: maintenanceId } } : {},
      relations: { maintenance: true, changedBy: true },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  // =====================================================================
  // HELPERS
  // =====================================================================
  private async getById(id: number) {
    const maintenance = await this.maintenances.findOne({ where: { id }, relations: RELATIONS });
    if (!maintenance) throw new NotFoundException(`El mantenimiento con id ${id} no existe`);
    return maintenance;
  }

  private async assertVehicleExists(vehicleId: number) {
    if (!(await this.vehicles.findOne({ where: { id: vehicleId } }))) {
      throw new NotFoundException(`El vehículo con id ${vehicleId} no existe`);
    }
  }

  /** El ADMIN ve todo; un TECHNICIAN solo lo que tiene asignado (403 en otro caso). */
  private async assertTechnicianOwnsMaintenance(
    manager: EntityManager,
    maintenance: Maintenance,
    user: AuthUser,
  ) {
    if (user.role !== Role.TECHNICIAN) return;
    const own = await manager.findOne(Mechanic, {
      where: { id: maintenance.mechanic.id, user: { id: user.id } },
    });
    if (!own) {
      throw new ForbiddenException('Solo puedes operar sobre los mantenimientos que tienes asignados');
    }
  }

  private writeLog(
    manager: EntityManager,
    maintenance: Maintenance,
    from: MaintenanceStatus | null,
    to: MaintenanceStatus,
    user: AuthUser,
  ) {
    return manager.save(
      manager.create(MaintenanceStatusLog, {
        maintenance: { id: maintenance.id } as Maintenance,
        fromStatus: from,
        toStatus: to,
        changedBy: { id: user.id } as User,
      }),
    );
  }
}
