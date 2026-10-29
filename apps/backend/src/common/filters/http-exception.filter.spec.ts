import {
  ArgumentsHost,
  BadGatewayException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { HttpExceptionFilter } from './http-exception.filter';

function hostWith(response: { status: jest.Mock; json: jest.Mock }): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ method: 'POST', url: '/api/v1/notices/extract-text' }),
    }),
  } as unknown as ArgumentsHost;
}

function capture(exception: unknown): { status: number; body: any } {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  new HttpExceptionFilter().catch(exception, hostWith(response));

  return { status: response.status.mock.calls[0][0], body: response.json.mock.calls[0][0] };
}

describe('HttpExceptionFilter', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('scrubs an unexpected 500 in production', () => {
    process.env.NODE_ENV = 'production';
    const { status, body } = capture(new InternalServerErrorException('connection string leaked'));

    expect(status).toBe(500);
    expect(body.error.message).toBe('Internal server error');
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('keeps the operator-facing message for an unconfigured integration', () => {
    process.env.NODE_ENV = 'production';
    const { status, body } = capture(
      new ServiceUnavailableException('Notice text extraction is not connected yet.')
    );

    expect(status).toBe(503);
    expect(body.error.message).toBe('Notice text extraction is not connected yet.');
  });

  it('keeps the operator-facing message when a provider fails', () => {
    process.env.NODE_ENV = 'production';
    const { body } = capture(
      new BadGatewayException('The text extraction service could not be reached.')
    );

    expect(body.error.message).toBe('The text extraction service could not be reached.');
  });

  it('keeps messages outside production', () => {
    process.env.NODE_ENV = 'development';
    const { body } = capture(new InternalServerErrorException('driver said no'));

    expect(body.error.message).toBe('driver said no');
  });
});
