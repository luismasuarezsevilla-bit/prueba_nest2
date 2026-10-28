import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maintenance } from '../maintenances/maintenance.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { IntegrationsController } from './integrations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, Maintenance])],
  controllers: [IntegrationsController],
})
export class IntegrationsModule {}
