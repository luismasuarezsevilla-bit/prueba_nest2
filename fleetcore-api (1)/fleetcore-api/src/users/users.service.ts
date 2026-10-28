import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Role } from '../common/enums';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async create(data: { email: string; password: string; fullName: string; role: Role }) {
    if (await this.users.findOne({ where: { email: data.email } })) {
      throw new ConflictException(`El correo ${data.email} ya está registrado`);
    }
    // bcrypt genera su propio salt y lo guarda dentro del hash; la contraseña nunca se persiste en claro
    const password = await bcrypt.hash(data.password, 10);
    const saved = await this.users.save(this.users.create({ ...data, password }));
    return this.toPublic(saved);
  }

  /** Incluye el hash (select:false lo oculta por defecto): solo para el login. */
  findByEmailWithPassword(email: string) {
    return this.users
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne();
  }

  findAll() {
    return this.users.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`El usuario con id ${id} no existe`);
    return user;
  }

  toPublic(user: User) {
    const { password, ...rest } = user;
    return rest;
  }
}
