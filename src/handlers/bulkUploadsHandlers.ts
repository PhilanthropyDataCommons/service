import { db } from '../database';
import {
  isTinyPgErrorWithQueryContext,
  isBulkUploadCreate,
  BulkUploadStatus,
} from '../types';
import {
  DatabaseError,
  InputValidationError,
} from '../errors';
import type {
  Request,
  Response,
  NextFunction,
} from 'express';
import type {
  BulkUpload,
  BulkUploadCreate,
} from '../types';

const createBulkUpload = (
  req: Request<unknown, unknown, BulkUploadCreate>,
  res: Response,
  next: NextFunction,
): void => {
  const { body } = req;
  if (!isBulkUploadCreate(body)) {
    next(new InputValidationError(
      'Invalid request body.',
      isBulkUploadCreate.errors ?? [],
    ));
    return;
  }

  (async () => {
    const bulkUploadsQueryResult = await db.sql<BulkUpload>('bulkUploads.insertOne', {
      fileName: body.fileName,
      sourceUrl: body.sourceUrl,
      status: BulkUploadStatus.PENDING,
    });
    const bulkUpload = bulkUploadsQueryResult.rows[0];
    res.status(201)
      .contentType('application/json')
      .send(bulkUpload);
  })().catch((error: unknown) => {
    if (isTinyPgErrorWithQueryContext(error)) {
      next(new DatabaseError(
        'Error creating bulk upload.',
        error,
      ));
      return;
    }
    next(error);
  });
};

export const bulkUploadsHandlers = {
  createBulkUpload,
};
