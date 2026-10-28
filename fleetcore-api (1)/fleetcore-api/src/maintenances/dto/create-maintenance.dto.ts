import { IsDateString, IsEnum, IsInt, IsString, Length, Min } from 'class-validator';
import { MaintenanceType } from '../../common/enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMaintenanceDto {
  @ApiProperty({ example: 1, description: 'ID de un vehículo disponible consultado en GET /vehicles' })
  @IsInt()
  vehicleId: number;

  @ApiProperty({ example: 1, description: 'ID de un mecánico activo consultado en GET /mechanics' })
  @IsInt()
  mechanicId: number;

  @ApiProperty({ example: 1, description: 'ID de un taller activo consultado en GET /workshops/active' })
  @IsInt()
  workshopId: number;

  @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.PREVENTIVE })
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @ApiProperty({ example: 'Revisión general y cambio de aceite' })
  @IsString()
  @Length(3, 1000)
  description: string;

  /** Kilometraje del vehículo al momento del servicio (>= kilometraje actual del vehículo). */
  @ApiProperty({ example: 45000 })
  @IsInt()
  @Min(0)
  mileage: number;

  /** Inicio programado, ISO 8601. Ej: 2026-11-02T07:30:00.000Z */
  @ApiProperty({ example: '2026-11-02T13:00:00.000Z' })
  @IsDateString()
  scheduledStart: string;

  /** Fin programado, ISO 8601. Necesario para detectar cruces de horario. */
  @ApiProperty({ example: '2026-11-02T15:00:00.000Z' })
  @IsDateString()
  scheduledEnd: string;
}
