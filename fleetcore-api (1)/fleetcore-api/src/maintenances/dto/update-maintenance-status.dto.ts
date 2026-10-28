import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { MaintenanceStatus } from '../../common/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMaintenanceStatusDto {
  @ApiProperty({ enum: MaintenanceStatus, example: MaintenanceStatus.COMPLETED })
  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus;

  // ---- Datos de cierre: obligatorios solo cuando status = COMPLETED ----
  @ApiPropertyOptional({ example: 'Cambio de aceite y filtros' })
  @IsOptional()
  @IsString()
  @Length(3, 2000)
  workDone?: string;

  @ApiPropertyOptional({ example: 350000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  finalCost?: number;

  @ApiPropertyOptional({ example: '2026-11-02T15:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  finishedAt?: string;

  @ApiPropertyOptional({ example: 45100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  finalMileage?: number;
}
