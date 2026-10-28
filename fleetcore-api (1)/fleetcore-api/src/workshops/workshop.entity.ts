import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ActiveStatus } from '../common/enums';
import { Maintenance } from '../maintenances/maintenance.entity';

@Entity('workshops')
export class Workshop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  address: string;

  @Column({ type: 'enum', enum: ActiveStatus, default: ActiveStatus.ACTIVE })
  status: ActiveStatus;

  @OneToMany(() => Maintenance, (m) => m.workshop)
  maintenances: Maintenance[];
}
