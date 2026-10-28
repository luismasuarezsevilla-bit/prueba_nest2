import { IsInt, IsString, Length, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

const upperTrim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class CreateVehicleDto {
  @ApiProperty({ example: 'MNO345', description: 'Placa única del vehículo' })
  @IsString()
  @Length(5, 10)
  @Transform(upperTrim)
  plate: string;

  @ApiProperty({ example: 'Mazda' })
  @IsString()
  @Length(1, 60)
  brand: string;

  @ApiProperty({ example: 'T3500' })
  @IsString()
  @Length(1, 60)
  model: string;

  @ApiProperty({ example: 2022 })
  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiProperty({ example: 5000 })
  @IsInt()
  @Min(0)
  mileage: number;
}
