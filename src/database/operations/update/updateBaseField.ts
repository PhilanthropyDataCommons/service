import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type {
  BaseField,
  BaseFieldWrite,
} from '../../../types';

export const updateBaseField = async (
  id: number,
  updateValues: BaseFieldWrite,
): Promise<BaseField> => {
  const {
    label,
    description,
    shortCode,
    dataType,
  } = updateValues;
  const result = await db.sql<BaseField>(
    'baseFields.updateById',
    {
      id,
      label,
      description,
      shortCode,
      dataType,
    },
  );
  const baseField = result.rows[0];
  if (baseField === undefined) {
    throw new NotFoundError(
      'This base field does not exist.',
    );
  }
  return baseField;
};
