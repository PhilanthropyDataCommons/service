import { v4 as uuidv4 } from 'uuid';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { requireEnv } from 'require-env-variable';
import { s3Client } from '../s3Client';
import { isPresignedPostRequestWrite } from '../types';
import { InputValidationError } from '../errors';
import type { PresignedPost } from '@aws-sdk/s3-presigned-post';
import type {
  Request,
  Response,
  NextFunction,
} from 'express';

const {
  S3_BUCKET,
} = requireEnv(
  'S3_BUCKET',
);

const generatePresignedPost = async (
  fileType: string,
  fileSize: number,
): Promise<PresignedPost> => {
  const key = `${uuidv4()}`;
  return createPresignedPost(s3Client, {
    Bucket: S3_BUCKET,
    Key: key,
    Expires: 3600, // 1 hour
    Conditions: [
      ['eq', '$Content-Type', fileType],
      ['content-length-range', fileSize, fileSize],
    ],
  });
};

const createPresignedPostRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const body = req.body as unknown;
  if (!isPresignedPostRequestWrite(body)) {
    next(new InputValidationError(
      'Invalid request body.',
      isPresignedPostRequestWrite.errors ?? [],
    ));
    return;
  }

  (async () => {
    const {
      fileType,
      fileSize,
    } = body;
    const presignedPost = await generatePresignedPost(
      fileType,
      fileSize,
    );

    res.status(201)
      .contentType('application/json')
      .send({
        fileType,
        fileSize,
        presignedPost,
      });
  })().catch((error) => {
    next(error);
  });
};

export const presignedPostRequestsHandlers = {
  createPresignedPostRequest,
};
