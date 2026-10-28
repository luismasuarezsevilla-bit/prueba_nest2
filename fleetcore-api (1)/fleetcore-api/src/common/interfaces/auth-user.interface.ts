import { Role } from '../enums';

/** Usuario autenticado que la JwtStrategy deja en `request.user`. */
export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: Role;
}
