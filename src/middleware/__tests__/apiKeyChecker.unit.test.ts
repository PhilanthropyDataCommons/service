import fs from 'fs';
import { AuthenticationError } from '../../errors';
import { checkApiKey } from '../apiKeyChecker';
import type { NextFunction, Request, Response } from 'express';

describe('Authentication middleware', () => {
  const mockResponse: Partial<Response> = {};
  const nextFunction: NextFunction = jest.fn();
  const environment = process.env;
  const fileWithApiTestKeys = 'test_keys.txt';

  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
    process.env = { ...environment, API_KEYS_FILE: fileWithApiTestKeys };
  });

  afterEach(() => {
    process.env = environment;
  });

  it('without x-api-key header', async () => {
    const mockRequest: Partial<Request> = {
      headers: {},
    };
    checkApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toBeCalledWith(
      new AuthenticationError(
        'API key not provided in the header "x-api-key"',
      ),
    );
  });

  it('without empty x-api-key header', async () => {
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
    const data = fs.readFileSync(fileWithApiTestKeys, 'utf8').split('\n');
    const mockRequest: Partial<Request> = {
      headers: {
        'x-api-key': data[0],
      },
    };
    checkApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toBeCalledTimes(1);
  });

  it('with correct api key but non-existent keys file', async () => {
    process.env = { ...environment, API_KEYS_FILE: '/path/to/non-existent/file' };
    const data = fs.readFileSync(fileWithApiTestKeys, 'utf8').split('\n');
    const mockRequest: Partial<Request> = {
      headers: {
        'x-api-key': data[0],
      },
    };
    checkApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toBeCalledWith('Internal Server Error');
  });

  it('with correct api key but no API_KEYS_FILE specified', async () => {
    process.env = { ...environment, API_KEYS_FILE: undefined };
    const data = fs.readFileSync(fileWithApiTestKeys, 'utf8').split('\n');
    const mockRequest: Partial<Request> = {
      headers: {
        'x-api-key': data[0],
      },
    };
    checkApiKey(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toBeCalledWith('Internal Server Error');
  });
});
