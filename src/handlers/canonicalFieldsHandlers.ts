import type {
  Request,
  Response,
} from 'express';

function getCanonicalFields(req: Request, res: Response): void {
  res.status(200)
    .contentType('application/json')
    .send('{ "hello": "world"}');
}

export const canonicalFieldsHandlers = {
  getCanonicalFields,
};
