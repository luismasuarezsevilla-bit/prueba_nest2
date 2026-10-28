import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mechanic } from '../mechanics/mechanic.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Workshop } from '../workshops/workshop.entity';
import { MaintenanceStatusLog } from './maintenance-status-log.entity';
import { Maintenance } from './maintenance.entity';
import { MaintenancesController } from './maintenances.controller';
import { MaintenancesService } from './maintenances.service';

@Module({
  imports: [TypeOrmModule.forFeature([Maintenance, MaintenanceStatusLog, Vehicle, Mechanic, Workshop])],
  controllers: [MaintenancesController],
  providers: [MaintenancesService],
  exports: [TypeOrmModule],
})
export class MaintenancesModule {}
