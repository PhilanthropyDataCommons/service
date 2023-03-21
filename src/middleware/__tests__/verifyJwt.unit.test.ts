import { verifyJwt } from '../verifyJwt';
import type {
  NextFunction,
  Request,
  Response,
} from 'express';

describe('verifyJwt', () => {
  it('calls next with UnauthorizedError when no auth header is sent', async () => {
    const mockRequest = {} as unknown as Request;
    const mockResponse = {} as unknown as Response;
    const nextMock: NextFunction = jest.fn();

    verifyJwt(mockRequest, mockResponse, nextMock);
    // Because expressjwt does not synchronously call next, but rather calls setImmediate(next),
    // send another call to setImmediate to make sure previous calls to setImmediate have made it
    // through the event loop. Otherwise jest misses the call (it hasn't happened yet). Kudos:
    // https://stackoverflow.com/questions/41792927/jest-tests-cant-fail-within-setimmediate-or-process-nexttick-callback#answer-59604256
    await new Promise(setImmediate);
    expect(nextMock).toBeCalledWith(expect.objectContaining({
      name: 'UnauthorizedError',
      message: 'No authorization token was found',
    }));
  });
});
