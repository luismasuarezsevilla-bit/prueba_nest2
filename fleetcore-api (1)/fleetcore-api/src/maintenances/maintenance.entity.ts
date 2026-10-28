import { Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MaintenanceStatus, MaintenanceType } from '../common/enums';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Mechanic } from '../mechanics/mechanic.entity';
import { Workshop } from '../workshops/workshop.entity';
import { MaintenanceStatusLog } from './maintenance-status-log.entity';

// Postgres devuelve numeric como string; lo convertimos a number
const decimalToNumber = {
  to: (v?: number | null) => v,
  from: (v?: string | null) => (v === null || v === undefined ? null : parseFloat(v)),
};

@Entity('maintenances')
@Index(['mechanic', 'scheduledStart', 'scheduledEnd'])
@Index(['vehicle', 'status'])
export class Maintenance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: MaintenanceType })
  type: MaintenanceType;

  @Column({ type: 'text' })
  description: string;

  // Kilometraje registrado al crear (no puede ser menor al del vehículo)
  @Column({ type: 'int' })
  mileage: number;

  // Rango necesario para detectar cruces de horario del mecánico y del vehículo
  @Column({ type: 'timestamptz' })
  scheduledStart: Date;

  @Column({ type: 'timestamptz' })
  scheduledEnd: Date;

  @Column({ type: 'enum', enum: MaintenanceStatus, default: MaintenanceStatus.SCHEDULED })
  status: MaintenanceStatus;

  // ---- Datos de cierre (obligatorios solo al pasar a COMPLETED) ----
  @Column({ type: 'text', nullable: true })
  workDone: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true, transformer: decimalToNumber })
  finalCost: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  finalMileage: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Vehicle, (v) => v.maintenances, { nullable: false, onDelete: 'RESTRICT' })
  vehicle: Vehicle;

  @ManyToOne(() => Mechanic, (m) => m.maintenances, { nullable: false, onDelete: 'RESTRICT' })
  mechanic: Mechanic;

  @ManyToOne(() => Workshop, (w) => w.maintenances, { nullable: false, onDelete: 'RESTRICT' })
  workshop: Workshop;

  @OneToMany(() => MaintenanceStatusLog, (l) => l.maintenance)
  statusLogs: MaintenanceStatusLog[];
}
