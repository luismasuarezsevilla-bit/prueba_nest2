import { PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto';

/** El estado NO se edita aquí: se cambia con activate/deactivate o por el flujo de mantenimientos. */
export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}
