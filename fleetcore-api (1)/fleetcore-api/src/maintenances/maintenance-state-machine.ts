import { ConflictException } from '@nestjs/common';
import { MaintenanceStatus } from '../common/enums';

/**
 * Máquina de estados del mantenimiento.
 *   SCHEDULED   -> IN_PROGRESS | CANCELLED
 *   IN_PROGRESS -> COMPLETED   | CANCELLED
 *   COMPLETED   -> (final: no puede volver atrás)
 *   CANCELLED   -> (final: no puede pasar a IN_PROGRESS ni COMPLETED)
 */
export const ALLOWED_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  [MaintenanceStatus.SCHEDULED]: [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.IN_PROGRESS]: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.COMPLETED]: [],
  [MaintenanceStatus.CANCELLED]: [],
};

export function canTransition(from: MaintenanceStatus, to: MaintenanceStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Lanza 409 con un mensaje descriptivo si la transición no está permitida. */
export function assertTransition(from: MaintenanceStatus, to: MaintenanceStatus): void {
  if (canTransition(from, to)) return;

  if (from === MaintenanceStatus.COMPLETED) {
    throw new ConflictException(
      `Un mantenimiento COMPLETED no puede regresar a un estado anterior (intento: ${to})`,
    );
  }
  if (from === MaintenanceStatus.CANCELLED) {
    throw new ConflictException(
      `Un mantenimiento CANCELLED no puede cambiar a ${to}`,
    );
  }
  throw new ConflictException(
    `Transición inválida: de ${from} solo se puede pasar a ${ALLOWED_TRANSITIONS[from].join(' o ')} (intento: ${to})`,
  );
}
