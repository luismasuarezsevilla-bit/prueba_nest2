import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActiveStatus } from '../common/enums';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { Workshop } from './workshop.entity';

@Injectable()
export class WorkshopsService {
  constructor(@InjectRepository(Workshop) private readonly workshops: Repository<Workshop>) {}

  async create(dto: CreateWorkshopDto) {
    await this.assertNameFree(dto.name);
    return this.workshops.save(this.workshops.create(dto));
  }

  findAll() {
    return this.workshops.find({ order: { id: 'ASC' } });
  }

  findActive() {
    return this.workshops.find({ where: { status: ActiveStatus.ACTIVE }, order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const workshop = await this.workshops.findOne({ where: { id } });
    if (!workshop) throw new NotFoundException(`El taller con id ${id} no existe`);
    return workshop;
  }

  async update(id: number, dto: UpdateWorkshopDto) {
    const workshop = await this.findOne(id);
    if (dto.name && dto.name !== workshop.name) await this.assertNameFree(dto.name);
    return this.workshops.save(Object.assign(workshop, dto));
  }

  async setStatus(id: number, status: ActiveStatus) {
    const workshop = await this.findOne(id);
    workshop.status = status;
    return this.workshops.save(workshop);
  }

  private async assertNameFree(name: string) {
    if (await this.workshops.findOne({ where: { name } })) {
      throw new ConflictException(`Ya existe un taller con el nombre ${name}`);
    }
  }
}
