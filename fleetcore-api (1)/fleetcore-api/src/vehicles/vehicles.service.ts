import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MaintenanceStatus, VehicleStatus } from '../common/enums';
import { Maintenance } from '../maintenances/maintenance.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
    @InjectRepository(Maintenance) private readonly maintenances: Repository<Maintenance>,
  ) {}

  async create(dto: CreateVehicleDto) {
    await this.assertPlateFree(dto.plate);
    return this.vehicles.save(this.vehicles.create({ ...dto, status: VehicleStatus.AVAILABLE }));
  }

  findAll(status?: VehicleStatus) {
    return this.vehicles.find({ where: status ? { status } : {}, order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const vehicle = await this.vehicles.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException(`El vehículo con id ${id} no existe`);
    return vehicle;
  }

  async findByPlate(plate: string) {
    const vehicle = await this.vehicles.findOne({ where: { plate: plate.trim().toUpperCase() } });
    if (!vehicle) throw new NotFoundException(`El vehículo con placa ${plate} no existe`);
    return vehicle;
  }

  async update(id: number, dto: UpdateVehicleDto) {
    const vehicle = await this.findOne(id);
    if (dto.plate && dto.plate !== vehicle.plate) await this.assertPlateFree(dto.plate);
    return this.vehicles.save(Object.assign(vehicle, dto));
  }

  /** Eliminación lógica: pasa a INACTIVE y conserva todo el historial de mantenimientos. */
  async deactivate(id: number) {
    const vehicle = await this.findOne(id);
    const hasActive = await this.maintenances.count({
      where: {
        vehicle: { id },
        status: In([MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]),
      },
    });
    if (hasActive > 0) {
      throw new ConflictException(
        `El vehículo ${vehicle.plate} tiene mantenimientos activos; cancélalos o finalízalos antes de inactivarlo`,
      );
    }
    vehicle.status = VehicleStatus.INACTIVE;
    return this.vehicles.save(vehicle);
  }

  async activate(id: number) {
    const vehicle = await this.findOne(id);
    if (vehicle.status !== VehicleStatus.INACTIVE) {
      throw new ConflictException(`El vehículo ${vehicle.plate} no está inactivo`);
    }
    vehicle.status = VehicleStatus.AVAILABLE;
    return this.vehicles.save(vehicle);
  }

  private async assertPlateFree(plate: string) {
    if (await this.vehicles.findOne({ where: { plate } })) {
      throw new ConflictException(`Ya existe un vehículo con la placa ${plate}`);
    }
  }
}
