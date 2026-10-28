import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ActiveStatus } from '../common/enums';
import { User } from '../users/user.entity';
import { Maintenance } from '../maintenances/maintenance.entity';

@Entity('mechanics')
export class Mechanic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  specialty: string;

  @Column({ type: 'enum', enum: ActiveStatus, default: ActiveStatus.ACTIVE })
  status: ActiveStatus;

  // Vincula al mecánico con su usuario TECHNICIAN (opcional, 1 a 1)
  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  // Sin vínculo fijo a un taller: puede trabajar en varios según el horario
  @OneToMany(() => Maintenance, (m) => m.mechanic)
  maintenances: Maintenance[];
}
