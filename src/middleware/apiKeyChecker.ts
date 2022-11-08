import fs from 'fs';
import { AuthenticationError } from '../errors';
import type {
  NextFunction,
  Request,
  Response,
} from 'express';

export const checkApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] ?? '';
  if (apiKey === '') {
    next(new AuthenticationError(
      'API key not provided in the header',
    ));
  } else {
    try {
      const data = fs.readFileSync('keys.txt', 'utf8').split('\n');
      if (data.includes(apiKey.toString())) {
        next();
      } else {
        next(new AuthenticationError(
          'Invalid api key provided',
        ));
      }
    } catch (err) {
      next('Internal server error');
    }
  }
};
