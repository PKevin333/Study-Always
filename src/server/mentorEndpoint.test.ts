import { describe, expect, it, vi } from 'vitest';
import { createMentorAdviceHandler, extractBearerToken } from './mentorEndpoint';

function createMockResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    }
  };
}

describe('extractBearerToken', () => {
  it('returns null when header is missing', () => {
    expect(extractBearerToken()).toBeNull();
  });

  it('returns null when scheme is invalid', () => {
    expect(extractBearerToken('Basic abc')).toBeNull();
  });

  it('returns the token for a valid bearer header', () => {
    expect(extractBearerToken('Bearer token-123')).toBe('token-123');
  });
});

describe('createMentorAdviceHandler', () => {
  it('rejects requests without token', async () => {
    const verifyIdToken = vi.fn();
    const generateMentorAdvice = vi.fn();
    const handler = createMentorAdviceHandler(verifyIdToken, generateMentorAdvice);
    const response = createMockResponse();

    await handler({ headers: {}, body: {} } as any, response as any);

    expect(response.statusCode).toBe(401);
    expect(verifyIdToken).not.toHaveBeenCalled();
    expect(generateMentorAdvice).not.toHaveBeenCalled();
  });

  it('rejects requests with invalid token', async () => {
    const verifyIdToken = vi.fn().mockRejectedValue(new Error('invalid token'));
    const generateMentorAdvice = vi.fn();
    const handler = createMentorAdviceHandler(verifyIdToken, generateMentorAdvice);
    const response = createMockResponse();

    await handler(
      {
        headers: { authorization: 'Bearer invalid-token' },
        body: { userData: {}, subjects: [], sessions: [] }
      } as any,
      response as any
    );

    expect(response.statusCode).toBe(401);
    expect(generateMentorAdvice).not.toHaveBeenCalled();
  });

  it('allows requests with valid token and returns mentor advice', async () => {
    const verifyIdToken = vi.fn().mockResolvedValue({ uid: 'user-123' });
    const generateMentorAdvice = vi.fn().mockResolvedValue({
      title: 'OK',
      content: 'Tudo certo',
      actionPoints: ['A', 'B', 'C']
    });
    const handler = createMentorAdviceHandler(verifyIdToken, generateMentorAdvice);
    const response = createMockResponse();
    const body = { userData: { area: 'controle' }, subjects: [{ name: 'Português' }], sessions: [] };

    await handler(
      {
        headers: { authorization: 'Bearer valid-token' },
        body
      } as any,
      response as any
    );

    expect(response.statusCode).toBe(200);
    expect(verifyIdToken).toHaveBeenCalledWith('valid-token');
    expect(generateMentorAdvice).toHaveBeenCalledWith(body.userData, body.subjects, body.sessions);
    expect(response.body).toEqual({
      title: 'OK',
      content: 'Tudo certo',
      actionPoints: ['A', 'B', 'C']
    });
  });
});
