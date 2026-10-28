import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApiKeyAuth } from '../common/decorators/api-key-auth.decorator';
import { MaintenanceStatus, VehicleStatus } from '../common/enums';
import { Maintenance } from '../maintenances/maintenance.entity';
import { Vehicle } from '../vehicles/vehicle.entity';

/**
 * Endpoints para sistemas externos: se autentican con el header `x-api-key`
 * (no con JWT). Las claves válidas viven en la variable de entorno API_KEYS.
 */
@ApiTags('Integrations')
@ApiKeyAuth()
@Controller('integrations')
export class IntegrationsController {
  constructor(
    @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
    @InjectRepository(Maintenance) private readonly maintenances: Repository<Maintenance>,
  ) {}

  @Get('vehicles/:plate/maintenances')
  @ApiOperation({ summary: 'Historial de mantenimientos completados de un vehículo, por placa (x-api-key)' })
  async vehicleHistory(@Param('plate') plate: string) {
    const vehicle = await this.vehicles.findOne({ where: { plate: plate.trim().toUpperCase() } });
    if (!vehicle) throw new NotFoundException(`El vehículo con placa ${plate} no existe`);

    const completed = await this.maintenances.find({
      where: { vehicle: { id: vehicle.id }, status: In([MaintenanceStatus.COMPLETED]) },
      relations: { mechanic: true, workshop: true },
      order: { finishedAt: 'ASC' },
    });

    return {
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        available: vehicle.status === VehicleStatus.AVAILABLE,
      },
      maintenances: completed.map((m) => ({
        id: m.id,
        type: m.type,
        status: m.status,
        description: m.workDone ?? m.description,
        mileage: m.finalMileage ?? m.mileage,
        cost: m.finalCost,
        finishedAt: m.finishedAt,
        mechanic: { id: m.mechanic.id, name: m.mechanic.name },
        workshop: { id: m.workshop.id, name: m.workshop.name },
      })),
    };
  }
}
