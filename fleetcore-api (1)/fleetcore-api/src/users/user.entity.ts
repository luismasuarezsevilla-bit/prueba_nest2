import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../common/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  // select:false evita que el hash viaje en consultas normales
  @Column({ select: false })
  password: string;

  @Column()
  fullName: string;

  @Column({ type: 'enum', enum: Role, default: Role.TECHNICIAN })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
