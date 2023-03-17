import { expressjwt } from 'express-jwt';
import { jwtOptions } from '../auth/jwtOptions';
import type {
  NextFunction,
  Request,
  Response,
} from 'express';

const expressJwtMiddleware = expressjwt(jwtOptions);

export const verifyJwt = (req: Request, res: Response, next: NextFunction): void => {
  expressJwtMiddleware(req, res, next)
    .catch((error: unknown) => {
      throw error;
    });
};
