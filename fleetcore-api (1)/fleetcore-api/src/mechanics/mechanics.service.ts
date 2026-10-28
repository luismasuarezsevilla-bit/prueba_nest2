import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActiveStatus, Role } from '../common/enums';
import { User } from '../users/user.entity';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import { Mechanic } from './mechanic.entity';

@Injectable()
export class MechanicsService {
  constructor(
    @InjectRepository(Mechanic) private readonly mechanics: Repository<Mechanic>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async create(dto: CreateMechanicDto) {
    await this.assertEmailFree(dto.email);
    const { userId, ...data } = dto;
    const user = userId !== undefined ? await this.resolveTechnician(userId) : null;
    const saved = await this.mechanics.save(this.mechanics.create({ ...data, user }));
    return this.findOne(saved.id);
  }

  findAll() {
    return this.mechanics.find({ relations: { user: true }, order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const mechanic = await this.mechanics.findOne({ where: { id }, relations: { user: true } });
    if (!mechanic) throw new NotFoundException(`El mecánico con id ${id} no existe`);
    return mechanic;
  }

  async update(id: number, dto: UpdateMechanicDto) {
    const mechanic = await this.findOne(id);
    const { userId, ...data } = dto;
    if (data.email && data.email !== mechanic.email) await this.assertEmailFree(data.email);
    if (userId !== undefined && userId !== mechanic.user?.id) {
      mechanic.user = await this.resolveTechnician(userId);
    }
    Object.assign(mechanic, data);
    await this.mechanics.save(mechanic);
    return this.findOne(id);
  }

  /** Inactivar NO borra nada: el historial de mantenimientos del mecánico se conserva. */
  setStatus(id: number, status: ActiveStatus) {
    return this.findOne(id).then((m) => {
      m.status = status;
      return this.mechanics.save(m);
    });
  }

  private async assertEmailFree(email: string) {
    if (await this.mechanics.findOne({ where: { email } })) {
      throw new ConflictException(`Ya existe un mecánico con el correo ${email}`);
    }
  }

  private async resolveTechnician(userId: number) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`El usuario con id ${userId} no existe`);
    if (user.role !== Role.TECHNICIAN) {
      throw new BadRequestException('Solo se puede vincular un usuario con rol TECHNICIAN');
    }
    const taken = await this.mechanics.findOne({ where: { user: { id: userId } } });
    if (taken) throw new ConflictException(`El usuario ${userId} ya está vinculado a otro mecánico`);
    return user;
  }
}
