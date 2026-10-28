import { ConflictException } from '@nestjs/common';
import { MaintenanceStatus as S } from '../common/enums';
import { assertTransition, canTransition } from './maintenance-state-machine';

describe('Máquina de estados de mantenimiento', () => {
  it.each([
    [S.SCHEDULED, S.IN_PROGRESS],
    [S.SCHEDULED, S.CANCELLED],
    [S.IN_PROGRESS, S.COMPLETED],
    [S.IN_PROGRESS, S.CANCELLED],
  ])('permite %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
    expect(() => assertTransition(from, to)).not.toThrow();
  });

  it('un COMPLETED no puede regresar a un estado anterior', () => {
    for (const to of [S.SCHEDULED, S.IN_PROGRESS, S.CANCELLED]) {
      expect(() => assertTransition(S.COMPLETED, to)).toThrow(ConflictException);
    }
    expect(() => assertTransition(S.COMPLETED, S.SCHEDULED)).toThrow(/COMPLETED/);
  });

  it('un CANCELLED no puede pasar a IN_PROGRESS ni a COMPLETED', () => {
    expect(() => assertTransition(S.CANCELLED, S.IN_PROGRESS)).toThrow(ConflictException);
    expect(() => assertTransition(S.CANCELLED, S.COMPLETED)).toThrow(/CANCELLED/);
  });

  it('SCHEDULED no puede saltar directo a COMPLETED', () => {
    expect(() => assertTransition(S.SCHEDULED, S.COMPLETED)).toThrow(/Transición inválida/);
  });
});
