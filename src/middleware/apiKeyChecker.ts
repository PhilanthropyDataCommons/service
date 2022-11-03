import { URL } from 'url';
import axios from 'axios';
import { AuthenticationError, EnvVariableError } from '../errors';
import type { AxiosError } from 'axios';
import type {
  NextFunction,
  Request,
  Response,
} from 'express';

export const checkApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] ?? '';
  const authServer = process.env.AUTH_SERVER_URL ?? '';
  const realmName = process.env.AUTH_REALM_NAME ?? '';
  if (apiKey === '') {
    next(new AuthenticationError(
      'API key not provided in the header',
    ));
  } else if (authServer === '' || realmName === '') {
    next(new EnvVariableError(
      'Environment variables not set.',
    ));
  } else {
    const url = new URL(`${authServer}/realms/${realmName}/check`);
    url.searchParams.append('apiKey', apiKey.toString());
    axios.get(url.toString())
      .then(() => {
        next();
      })
      .catch((error: AxiosError) => {
        let errorMessage = '';
        if (error.code === 'ERR_BAD_REQUEST') {
          errorMessage = 'Invalid api key provided';
        } else if (error.code === 'ECONNREFUSED') {
          errorMessage = 'Auth server not responding.';
        }
        next(new AuthenticationError(errorMessage));
      });
  }
};
