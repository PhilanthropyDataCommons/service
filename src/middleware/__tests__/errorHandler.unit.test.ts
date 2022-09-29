import { TinyPgError } from 'tinypg';
import { errorHandler } from '../errorHandler';
import { DatabaseError } from '../../errors';
import type {
  Request,
  Response,
} from 'express';

describe('errorHandler', () => {
  it('should process errors that are not Errors', () => {
    const err = 42;
    const req = {} as Request;
    const res = {} as unknown as Response;
    const statusMock = jest.fn().mockReturnValue(res);
    const contentTypeMock = jest.fn().mockReturnValue(res);
    const sendMock = jest.fn().mockReturnValue(res);
    res.status = statusMock;
    res.contentType = contentTypeMock;
    res.send = sendMock;
    const next = jest.fn();
    errorHandler(err, req, res, next);
    expect(statusMock).toBeCalledWith(500);
    expect(sendMock).toBeCalledWith(expect.objectContaining({
      name: 'UnknownError',
      message: 'Unknown error.',
      errors: [err],
    }));
  });

  it('should process Database Errors with unknown status codes', () => {
    const err = new DatabaseError(
      'A database error',
      new TinyPgError(
        'something unknown',
        undefined,
        {
          error: {
            code: 'some unexpected code',
          },
        },
      ),
    );
    const req = {} as Request;
    const res = {} as unknown as Response;
    const statusMock = jest.fn().mockReturnValue(res);
    const contentTypeMock = jest.fn().mockReturnValue(res);
    const sendMock = jest.fn().mockReturnValue(res);
    res.status = statusMock;
    res.contentType = contentTypeMock;
    res.send = sendMock;
    const next = jest.fn();
    errorHandler(err, req, res, next);
    expect(statusMock).toBeCalledWith(500);
    expect(sendMock).toBeCalledWith(expect.objectContaining({
      name: 'DatabaseError',
      message: 'Unexpected database error.',
      errors: [{
        code: 'some unexpected code',
      }],
    }));
  });
});
