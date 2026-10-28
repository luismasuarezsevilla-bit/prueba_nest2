import { ArgumentsHost, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { QueryFailedError } from 'typeorm';
import { AllExceptionsFilter } from './all-exceptions.filter';

type FilterResponse = {
  success: false;
  statusCode: number;
  message: string | string[];
  path: string;
  timestamp: string;
};

function run(exception: unknown) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }), getRequest: () => ({ url: '/maintenances' }) }),
  } as unknown as ArgumentsHost;
  new AllExceptionsFilter().catch(exception, host);
  return {
    status: status.mock.calls[0][0] as number,
    body: json.mock.calls[0][0] as FilterResponse,
  };
}

describe('AllExceptionsFilter', () => {
  it('mantiene el status y el mensaje de una HttpException', () => {
    const { status, body } = run(new NotFoundException('no existe'));
    expect(status).toBe(404);
    expect(body).toMatchObject({ success: false, statusCode: 404, message: 'no existe', path: '/maintenances' });
    expect(typeof body.timestamp).toBe('string');
  });

  it('convierte el error de unicidad de Postgres (23505) en 409, no en 500', () => {
    const err = new QueryFailedError('INSERT', [], { code: '23505', detail: 'Key (plate)=(ABC123) already exists.' } as any);
    const { status, body } = run(err);
    expect(status).toBe(409);
    expect(body.message).toContain('ABC123');
  });

  it('convierte un uuid/dato inválido (22P02) en 400', () => {
    const err = new QueryFailedError('SELECT', [], { code: '22P02' } as any);
    expect(run(err).status).toBe(400);
  });

  it('un error inesperado responde 500 con mensaje genérico', () => {
    const errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    try {
      const { status, body } = run(new Error('boom interno'));
      expect(status).toBe(500);
      expect(body.message).toBe('Error interno del servidor');
      expect(errorLog).toHaveBeenCalledWith('boom interno', expect.any(String));
    } finally {
      errorLog.mockRestore();
    }
  });

  it('un conflicto de negocio conserva el 409', () => {
    expect(run(new ConflictException('x')).status).toBe(409);
  });
});
