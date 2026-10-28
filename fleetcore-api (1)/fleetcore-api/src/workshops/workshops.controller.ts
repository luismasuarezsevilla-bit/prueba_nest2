import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ActiveStatus, Role } from '../common/enums';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { WorkshopsService } from './workshops.service';

@ApiTags('Workshops')
@ApiBearerAuth()
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar un taller (ADMIN)' })
  create(@Body() dto: CreateWorkshopDto) {
    return this.workshopsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todos los talleres (ADMIN)' })
  @ApiOkResponse({
    description: 'Incluye los talleres cargados por `npm run seed`.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: [
          { id: 1, name: 'Taller Centro', address: 'Cra 43 # 30-15, Barranquilla', status: 'ACTIVE' },
          { id: 2, name: 'Taller Norte', address: 'Calle 85 # 50-20, Barranquilla', status: 'INACTIVE' },
        ],
        timestamp: '2026-10-27T12:00:00.000Z',
      },
    },
  })
  findAll() {
    return this.workshopsService.findAll();
  }

  // Va antes de ':id' para que "active" no se interprete como un id
  @Get('active')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar solo los talleres activos' })
  findActive() {
    return this.workshopsService.findActive();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Consultar un taller' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workshopsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un taller (ADMIN)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkshopDto) {
    return this.workshopsService.update(id, dto);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activar un taller (ADMIN)' })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.workshopsService.setStatus(id, ActiveStatus.ACTIVE);
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Inactivar un taller (ADMIN)' })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.workshopsService.setStatus(id, ActiveStatus.INACTIVE);
  }
}
