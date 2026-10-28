import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcryptjs';
import { DataSource, DeepPartial, EntityTarget, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { AppModule } from '../app.module';
import {
  ActiveStatus,
  MaintenanceStatus,
  MaintenanceType,
  Role,
  VehicleStatus,
} from '../common/enums';
import { MaintenanceStatusLog } from '../maintenances/maintenance-status-log.entity';
import { Maintenance } from '../maintenances/maintenance.entity';
import { Mechanic } from '../mechanics/mechanic.entity';
import { User } from '../users/user.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Workshop } from '../workshops/workshop.entity';

/**
 * SEEDER IDEMPOTENTE: cada registro se busca por su clave única (correo, placa, nombre...)
 * y solo se crea si no existe, así que ejecutarlo varias veces no duplica datos.
 *
 *   npm run seed          (desarrollo)
 *   npm run seed:prod     (dentro del contenedor, usa el build compilado)
 */
async function findOrCreate<T extends ObjectLiteral>(
  ds: DataSource,
  entity: EntityTarget<T>,
  where: FindOptionsWhere<T>,
  data: DeepPartial<T>,
): Promise<{ row: T; created: boolean }> {
  const repo = ds.getRepository(entity);
  const existing = await repo.findOne({ where });
  if (existing) return { row: existing, created: false };
  return { row: await repo.save(repo.create(data)), created: true };
}

async function main() {
  // Contexto de aplicación (sin servidor HTTP): reutiliza la misma configuración y .env
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const ds = app.get(DataSource);

  // Usuarios 
  const userSeeds = [
    { email: 'admin@fleetcore.com', fullName: 'Admin FleetCore', password: 'Admin123*', role: Role.ADMIN },
    { email: 'tech1@fleetcore.com', fullName: 'Carlos Pérez', password: 'Tech123*', role: Role.TECHNICIAN },
    { email: 'tech2@fleetcore.com', fullName: 'Laura Gómez', password: 'Tech123*', role: Role.TECHNICIAN },
  ];
  const users: Record<string, User> = {};
  for (const u of userSeeds) {
    const exists = await ds.getRepository(User).findOne({ where: { email: u.email } });
    if (exists) {
      users[u.email] = exists;
      continue;
    }
    // El hash solo se calcula cuando el usuario realmente se va a crear
    users[u.email] = await ds
      .getRepository(User)
      .save(ds.getRepository(User).create({ ...u, password: await bcrypt.hash(u.password, 10) }));
  }

  // Mecánicos: 2 activos (vinculados a técnicos) + 1 inactivo 
  const carlos = (
    await findOrCreate(ds, Mechanic, { email: 'carlos.perez@fleetcore.com' }, {
      name: 'Carlos Pérez', email: 'carlos.perez@fleetcore.com', specialty: 'Motor y transmisión',
      status: ActiveStatus.ACTIVE, user: users['tech1@fleetcore.com'],
    })
  ).row;
  const laura = (
    await findOrCreate(ds, Mechanic, { email: 'laura.gomez@fleetcore.com' }, {
      name: 'Laura Gómez', email: 'laura.gomez@fleetcore.com', specialty: 'Frenos y suspensión',
      status: ActiveStatus.ACTIVE, user: users['tech2@fleetcore.com'],
    })
  ).row;
  await findOrCreate(ds, Mechanic, { email: 'pedro.ruiz@fleetcore.com' }, {
    name: 'Pedro Ruiz', email: 'pedro.ruiz@fleetcore.com', specialty: 'Electricidad automotriz',
    status: ActiveStatus.INACTIVE, user: null,
  });

  // Talleres: 1 activo + 1 inactivo 
  const centro = (
    await findOrCreate(ds, Workshop, { name: 'Taller Centro' }, {
      name: 'Taller Centro', address: 'Cra 43 # 30-15, Barranquilla', status: ActiveStatus.ACTIVE,
    })
  ).row;
  await findOrCreate(ds, Workshop, { name: 'Taller Norte' }, {
    name: 'Taller Norte', address: 'Calle 85 # 50-20, Barranquilla', status: ActiveStatus.INACTIVE,
  });

  //  Vehículos: 2 AVAILABLE, 1 IN_MAINTENANCE, 1 INACTIVE 
  const abc = (
    await findOrCreate(ds, Vehicle, { plate: 'ABC123' }, {
      plate: 'ABC123', brand: 'Chevrolet', model: 'NPR', year: 2020, mileage: 45000, status: VehicleStatus.AVAILABLE,
    })
  ).row;
  await findOrCreate(ds, Vehicle, { plate: 'DEF456' }, {
    plate: 'DEF456', brand: 'Hino', model: '300', year: 2021, mileage: 32000, status: VehicleStatus.AVAILABLE,
  });
  const ghi = (
    await findOrCreate(ds, Vehicle, { plate: 'GHI789' }, {
      plate: 'GHI789', brand: 'Isuzu', model: 'NHR', year: 2019, mileage: 78000, status: VehicleStatus.IN_MAINTENANCE,
    })
  ).row;
  await findOrCreate(ds, Vehicle, { plate: 'JKL012' }, {
    plate: 'JKL012', brand: 'Foton', model: 'Aumark', year: 2015, mileage: 150000, status: VehicleStatus.INACTIVE,
  });

  //  Mantenimientos 
  const admin = users['admin@fleetcore.com'];
  const seedMaintenance = async (where: FindOptionsWhere<Maintenance>, data: DeepPartial<Maintenance>) => {
    const { row, created } = await findOrCreate(ds, Maintenance, where, data);
    if (created) {
      const logs = ds.getRepository(MaintenanceStatusLog);
      await logs.save(logs.create({ maintenance: row, fromStatus: null, toStatus: MaintenanceStatus.SCHEDULED, changedBy: admin }));
      await logs.save(logs.create({ maintenance: row, fromStatus: MaintenanceStatus.SCHEDULED, toStatus: MaintenanceStatus.IN_PROGRESS, changedBy: admin }));
      if (row.status === MaintenanceStatus.COMPLETED) {
        await logs.save(logs.create({ maintenance: row, fromStatus: MaintenanceStatus.IN_PROGRESS, toStatus: MaintenanceStatus.COMPLETED, changedBy: admin }));
      }
    }
  };

  // COMPLETED (para mostrar historial)
  await seedMaintenance(
    { description: 'Cambio de aceite y filtros', vehicle: { id: abc.id } },
    {
      type: MaintenanceType.PREVENTIVE, description: 'Cambio de aceite y filtros', mileage: 44800,
      scheduledStart: new Date('2026-09-15T13:00:00.000Z'), scheduledEnd: new Date('2026-09-15T16:30:00.000Z'),
      status: MaintenanceStatus.COMPLETED, workDone: 'Cambio de aceite y filtros', finalCost: 350000,
      finishedAt: new Date('2026-09-15T16:30:00.000Z'), finalMileage: 45000,
      vehicle: abc, mechanic: carlos, workshop: centro,
    },
  );

  // IN_PROGRESS (el vehículo GHI789 está IN_MAINTENANCE por este mantenimiento)
  await seedMaintenance(
    { description: 'Reemplazo de pastillas de freno', vehicle: { id: ghi.id } },
    {
      type: MaintenanceType.CORRECTIVE, description: 'Reemplazo de pastillas de freno', mileage: 78000,
      scheduledStart: new Date('2026-10-27T13:00:00.000Z'), scheduledEnd: new Date('2026-10-27T18:00:00.000Z'),
      status: MaintenanceStatus.IN_PROGRESS, vehicle: ghi, mechanic: laura, workshop: centro,
    },
  );

  console.log('Seed completado (idempotente). Credenciales en el README.');
  await app.close();
}

main().catch((err) => {
  console.error('Error ejecutando el seed:', err);
  process.exit(1);
});
