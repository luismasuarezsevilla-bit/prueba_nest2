import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { MaintenancesService } from './maintenances.service';

@ApiTags('Maintenances')
@ApiBearerAuth()
@Controller('maintenances')
export class MaintenancesController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear un mantenimiento (estado inicial SCHEDULED)' })
  create(@Body() dto: CreateMaintenanceDto, @CurrentUser() user: AuthUser) {
    return this.maintenancesService.create(dto, user);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todos los mantenimientos' })
  findAll() {
    return this.maintenancesService.findAll();
  }

  // ---- Las rutas fijas van ANTES de ':id' para que no se interpreten como un id ----
  @Get('active')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mantenimientos activos (SCHEDULED o IN_PROGRESS)' })
  findActive() {
    return this.maintenancesService.findActive();
  }

  @Get('my')
  @Roles(Role.TECHNICIAN)
  @ApiOperation({ summary: 'Mis mantenimientos asignados, con su vehículo y taller (TECHNICIAN)' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.maintenancesService.findMine(user);
  }

  @Get('audit/logs')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Auditoría: todos los cambios de estado' })
  auditAll() {
    return this.maintenancesService.findAuditLogs();
  }

  @Get('vehicle/:vehicleId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mantenimientos de un vehículo' })
  findByVehicle(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.maintenancesService.findByVehicle(vehicleId);
  }

  @Get('vehicle/:vehicleId/history')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Historial de un vehículo (COMPLETED y CANCELLED)' })
  history(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.maintenancesService.findHistoryByVehicle(vehicleId);
  }

  @Get('mechanic/:mechanicId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mantenimientos asignados a un mecánico' })
  findByMechanic(@Param('mechanicId', ParseIntPipe) mechanicId: number) {
    return this.maintenancesService.findByMechanic(mechanicId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Detalle de un mantenimiento (el TECHNICIAN solo los suyos)' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.maintenancesService.findOne(id, user);
  }

  @Get(':id/audit')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Auditoría de un mantenimiento' })
  audit(@Param('id', ParseIntPipe) id: number) {
    return this.maintenancesService.findAuditLogs(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({
    summary: 'Actualizar el estado (el TECHNICIAN solo los suyos). Al pasar a COMPLETED exige workDone, finalCost, finishedAt y finalMileage',
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaintenanceStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.maintenancesService.updateStatus(id, dto, user);
  }
}
