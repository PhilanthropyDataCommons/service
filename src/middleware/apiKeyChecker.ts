import fs from 'fs';
import { AuthenticationError } from '../errors';
import { getLogger } from '../logger';
import type {
  NextFunction,
  Request,
  Response,
} from 'express';

const logger = getLogger(__filename);

export const checkApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] ?? '';
  if (apiKey === '') {
    next(new AuthenticationError(
      'API key not provided in the header \'x-api-key\'',
    ));
  } else {
    try {
      const validApiKeysFile = process.env.API_KEYS_FILE ?? 'keys.txt';
      const validApiKeys = fs.readFileSync(validApiKeysFile, 'utf8').split('\n');
      if (validApiKeys.includes(apiKey.toString())) {
        next();
      } else {
        next(new AuthenticationError(
          'Invalid API key provided',
        ));
      }
    } catch (err) {
      logger.error(err);
      next('Internal Server Error');
    }
  }
};
