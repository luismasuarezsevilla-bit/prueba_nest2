import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ActiveStatus, Role } from '../common/enums';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import { MechanicsService } from './mechanics.service';

@ApiTags('Mechanics')
@ApiBearerAuth()
@Controller('mechanics')
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar un mecánico (ADMIN)' })
  create(@Body() dto: CreateMechanicDto) {
    return this.mechanicsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar mecánicos (ADMIN)' })
  @ApiOkResponse({
    description: 'Incluye los mecánicos cargados por `npm run seed`.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: [
          { id: 1, name: 'Carlos Pérez', email: 'carlos.perez@fleetcore.com', specialty: 'Motor y transmisión', status: 'ACTIVE' },
          { id: 2, name: 'Laura Gómez', email: 'laura.gomez@fleetcore.com', specialty: 'Frenos y suspensión', status: 'ACTIVE' },
          { id: 3, name: 'Pedro Ruiz', email: 'pedro.ruiz@fleetcore.com', specialty: 'Electricidad automotriz', status: 'INACTIVE' },
        ],
        timestamp: '2026-10-27T12:00:00.000Z',
      },
    },
  })
  findAll() {
    return this.mechanicsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Consultar un mecánico' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un mecánico (ADMIN)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMechanicDto) {
    return this.mechanicsService.update(id, dto);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activar un mecánico (ADMIN)' })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicsService.setStatus(id, ActiveStatus.ACTIVE);
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Inactivar un mecánico sin perder su historial (ADMIN)' })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicsService.setStatus(id, ActiveStatus.INACTIVE);
  }
}
