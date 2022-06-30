import type { ApplicationSchemaField } from './ApplicationSchemaField';

export interface ApplicationSchema {
  id?: number;
  opportunity_title: string;
  version?: number;
  fields: ApplicationSchemaField[];
}
