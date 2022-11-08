import fs from 'fs';
import { AuthenticationError } from '../../errors';
import { checkApiKey } from '../apiKeyChecker';
import type { NextFunction, Request, Response } from 'express';

describe('Authorization middleware', () => {
  let mockRequest: Partial<Request> = {};
  const mockResponse: Partial<Response> = {};
  const nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('without x-api-key header', async () => {
    const expectedResponse = new AuthenticationError('API key not provided in the header');
    mockRequest = {
      headers: {
        'x-api-key': '',
      },
    };
    checkApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toBeCalledWith(expectedResponse);
  });

  it('with wrong api header', async () => {
    const expectedResponse = new AuthenticationError('Invalid api key provided');
    mockRequest = {
      headers: {
        'x-api-key': 'philanthropydatacommons',
      },
    };
    checkApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toBeCalledWith(expectedResponse);
  });

  it('with correct api header', async () => {
    const data = fs.readFileSync('keys.txt', 'utf8').split('\n');
    mockRequest = {
      headers: {
        'x-api-key': data[0],
      },
    };
    checkApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toBeCalledTimes(1);
  });
});
