import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkshopDto {
  @ApiProperty({ example: 'Taller Centro' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'Cra 43 # 30-15, Barranquilla' })
  @IsString()
  @Length(3, 200)
  address: string;
}
