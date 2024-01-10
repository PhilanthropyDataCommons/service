import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface TableMetrics {
	count: number;
	now: Date;
}

export const tableMetricsSchema: JSONSchemaType<TableMetrics> = {
	type: 'object',
	properties: {
		count: {
			type: 'integer',
		},
		now: {
			type: 'object',
			required: [],
			instanceof: 'Date',
		},
	},
	required: ['count', 'now'],
};

export const isTableMetrics = ajv.compile(tableMetricsSchema);
