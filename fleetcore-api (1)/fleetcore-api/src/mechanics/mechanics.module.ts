import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Mechanic } from './mechanic.entity';
import { MechanicsController } from './mechanics.controller';
import { MechanicsService } from './mechanics.service';

@Module({
  imports: [TypeOrmModule.forFeature([Mechanic, User])],
  controllers: [MechanicsController],
  providers: [MechanicsService],
  exports: [TypeOrmModule],
})
export class MechanicsModule {}
