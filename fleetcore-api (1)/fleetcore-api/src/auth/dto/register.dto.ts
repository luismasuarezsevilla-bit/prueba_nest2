import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

/** El registro público NO acepta `role`: siempre crea TECHNICIAN (evita auto-asignarse ADMIN). */
export class RegisterDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  fullName: string;
}
