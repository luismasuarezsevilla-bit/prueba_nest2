import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '../../common/enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'nuevo.admin@fleetcore.com' })
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Nuevo Administrador' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ enum: Role, example: Role.ADMIN })
  @IsEnum(Role)
  role: Role;
}
