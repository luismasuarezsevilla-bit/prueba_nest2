import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, VehicleStatus } from '../common/enums';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar un vehículo (ADMIN)' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar vehículos (ADMIN)' })
  @ApiOkResponse({
    description: 'Incluye los vehículos cargados por `npm run seed`.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: [
          { id: 1, plate: 'ABC123', brand: 'Chevrolet', model: 'NPR', year: 2020, mileage: 45000, status: 'AVAILABLE' },
          { id: 2, plate: 'DEF456', brand: 'Hino', model: '300', year: 2021, mileage: 32000, status: 'AVAILABLE' },
          { id: 3, plate: 'GHI789', brand: 'Isuzu', model: 'NHR', year: 2019, mileage: 78000, status: 'IN_MAINTENANCE' },
          { id: 4, plate: 'JKL012', brand: 'Foton', model: 'Aumark', year: 2015, mileage: 150000, status: 'INACTIVE' },
        ],
        timestamp: '2026-10-27T12:00:00.000Z',
      },
    },
  })
  @ApiQuery({ name: 'status', enum: VehicleStatus, required: false })
  findAll(@Query('status') status?: VehicleStatus) {
    return this.vehiclesService.findAll(status);
  }

  // OJO: esta ruta va antes de ':id' para que "plate" no se interprete como un id
  @Get('plate/:plate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Consultar un vehículo por placa' })
  findByPlate(@Param('plate') plate: string) {
    return this.vehiclesService.findByPlate(plate);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Consultar un vehículo por id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un vehículo (ADMIN)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reactivar un vehículo INACTIVE (ADMIN)' })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.activate(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminación lógica: inactiva el vehículo (ADMIN)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.deactivate(id);
  }
}
