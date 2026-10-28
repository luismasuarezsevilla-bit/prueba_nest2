import { IsEmail, IsInt, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMechanicDto {
  @ApiProperty({ example: 'Carlos Pérez' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'carlos.perez@fleetcore.com' })
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @ApiProperty({ example: 'Motor y transmisión' })
  @IsString()
  @Length(2, 100)
  specialty: string;

  /** Opcional: id del usuario TECHNICIAN que corresponde a este mecánico. */
  @ApiPropertyOptional({ example: 2, description: 'ID del usuario TECHNICIAN asociado' })
  @IsOptional()
  @IsInt()
  userId?: number;
}
