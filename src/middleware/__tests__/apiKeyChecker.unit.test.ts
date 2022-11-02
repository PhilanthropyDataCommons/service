import { AuthenticationError } from '../../errors';
import { checkApiKey } from '../apiKeyChecker';
import type { NextFunction, Request, Response } from 'express';

describe('Authorization middleware', () => {
  let mockRequest: Partial<Request> = {};
  let mockResponse: Partial<Response> = {
    json: jest.fn(),
  };
  const nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
  });

  it('without x-api-key header', async () => {
    const expectedResponse = new AuthenticationError('API key not provided in the header');
    mockRequest = {
      headers: {
        'x-api-key': '',
      },
    };
    await checkApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toBeCalledWith(expectedResponse);
  });

  it('with wrong api header', async () => {
    const expectedResponse = new AuthenticationError('Invalid api key provided');
    mockRequest = {
      headers: {
        'x-api-key': 'philanthropydatacommons',
      },
    };
    await checkApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toBeCalledWith(expectedResponse);
  });
});
