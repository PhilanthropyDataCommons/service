import http from 'http';
import { ApiKeyError } from '../errors';
import type {
  NextFunction,
  Request,
  Response,
} from 'express';

export const checkApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] ?? '';
  const authServer = process.env.AUTH_SERVER_URL ?? '';
  const realmName = process.env.REALM_NAME ?? '';
  http.get(`http://${authServer}/realms/${realmName}/check?apiKey=${apiKey.toString()}`, (authResponse: http.IncomingMessage) => {
    if (authResponse.statusCode === 200) {
      next();
    } else {
      next(new ApiKeyError(
        'Invalid api-key provided',
        [],
      ));
    }
  });
};
