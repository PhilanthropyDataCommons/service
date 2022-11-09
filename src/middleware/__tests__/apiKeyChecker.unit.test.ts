import fs from 'fs';
import { AuthenticationError } from '../../errors';
import { checkApiKey } from '../apiKeyChecker';
import type { NextFunction, Request, Response } from 'express';

describe('Authorization middleware', () => {
  const mockResponse: Partial<Response> = {};
  const nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('without x-api-key header', async () => {
    const mockRequest: Partial<Request> = {
      headers: {
        'x-api-key': '',
      },
    };
    checkApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toBeCalledWith(
      new AuthenticationError(
        'API key not provided in the header "x-api-key"',
      ),
    );
  });

  it('with wrong api header', async () => {
    const mockRequest: Partial<Request> = {
      headers: {
        'x-api-key': 'philanthropydatacommons',
      },
    };
    checkApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toBeCalledWith(
      new AuthenticationError(
        'Invalid api key provided',
      ),
    );
  });

  it('with correct api header', async () => {
    const data = fs.readFileSync('test_keys.txt', 'utf8').split('\n');
    const mockRequest: Partial<Request> = {
      headers: {
        'x-api-key': data[0],
      },
    };
    checkApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toBeCalledTimes(1);
  });
});
