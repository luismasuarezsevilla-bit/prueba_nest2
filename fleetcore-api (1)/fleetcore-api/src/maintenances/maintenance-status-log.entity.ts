import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MaintenanceStatus } from '../common/enums';
import { Maintenance } from './maintenance.entity';
import { User } from '../users/user.entity';

/** Auditoría: una fila por cada cambio de estado de un mantenimiento. */
@Entity('maintenance_status_logs')
export class MaintenanceStatusLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Maintenance, (m) => m.statusLogs, { nullable: false, onDelete: 'CASCADE' })
  maintenance: Maintenance;

  @Column({ type: 'enum', enum: MaintenanceStatus, nullable: true })
  fromStatus: MaintenanceStatus | null;

  @Column({ type: 'enum', enum: MaintenanceStatus })
  toStatus: MaintenanceStatus;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  changedBy: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
