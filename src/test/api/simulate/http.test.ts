import { describe, it, expect } from 'vitest';
import handler from '../../../../api/simulate/index';
import { createBaseInputParams, createMockResponse } from './helpers';

describe('/api/simulate HTTP レベルの基本動作', () => {
  it('TC-HTTP-001: POST /api/simulate 正常系', async () => {
    const inputParams = createBaseInputParams();
    const { res, result } = createMockResponse();

    const req = {
      method: 'POST',
      body: { inputParams },
      query: {},
    };

    await handler(req as never, res as never);

    expect(result.statusCode).toBe(200);
    expect(result.jsonBody).toBeTruthy();

    const body = result.jsonBody as { yearlyData?: unknown };
    expect(Array.isArray(body.yearlyData)).toBe(true);

    const yearlyData = body.yearlyData as unknown[];
    expect(yearlyData.length).toBe(
      inputParams.endAge - inputParams.initialAge + 1,
    );
  });

  it('TC-HTTP-002: GET /api/simulate は 405 を返す', async () => {
    const { res, result } = createMockResponse();

    const req = {
      method: 'GET',
      body: undefined,
      query: {},
    };

    await handler(req as never, res as never);

    expect(result.statusCode).toBe(405);
    const body = result.jsonBody as { message?: string } | undefined;
    expect(body?.message).toBeDefined();
  });

  it('TC-HTTP-003 相当: body 不正時は 400 を返す', async () => {
    const { res, result } = createMockResponse();

    const req = {
      method: 'POST',
      body: { foo: 'bar' }, // inputParams が存在しない不正ボディ
      query: {},
    };

    await handler(req as never, res as never);

    expect(result.statusCode).toBe(400);
    const body = result.jsonBody as { message?: string } | undefined;
    expect(body?.message).toMatch(/invalid body/i);
  });
});
