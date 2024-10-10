import { requireEnv } from 'require-env-variable';
import {
	isSyncBaseFieldsJobPayload,
	SyncBaseFieldsJobPayload,
} from '../types';
import {
	createOrUpdateBaseField,
	createOrUpdateBaseFieldLocalization,
} from '../database';
import type { JobHelpers } from 'graphile-worker';

const { SYNCHRONIZATION_URL } = requireEnv('SYNCHRONIZATION_URL');

export const fetchBaseFieldsFromRemote =
	async (): Promise<SyncBaseFieldsJobPayload> => {
		let baseFields: SyncBaseFieldsJobPayload;
		try {
			baseFields = (await fetch(`${SYNCHRONIZATION_URL}/baseFields`).then(
				(response) => response.json(),
			)) as SyncBaseFieldsJobPayload;
		} catch (err) {
			throw new Error('Unable to connect to remote pdc instance');
		}

		return baseFields;
	};

export const syncBaseFields = async (
	payload: unknown,
	helpers: JobHelpers,
): Promise<void> => {
	if (!isSyncBaseFieldsJobPayload(payload)) {
		helpers.logger.error('Malformed sync BaseFields job payload', {
			errors: isSyncBaseFieldsJobPayload.errors ?? [],
		});
		return;
	}

	helpers.logger.debug(`Started syncBaseFields Job at ${Date.now()}`);

	await Promise.all(
		payload.baseFields.map<Promise<void>>(async (baseField) => {
			const { scope, dataType, shortCode, label, description } = baseField;
			const createdBaseField = await createOrUpdateBaseField({
				scope,
				dataType,
				shortCode,
				label,
				description,
			});
			await Promise.all(
				Object.entries(baseField.localizations).map(
					async (keyAndBaseFieldLocalization) => {
						const baseFieldLocalization = keyAndBaseFieldLocalization[1];
						await createOrUpdateBaseFieldLocalization({
							baseFieldId: createdBaseField.id,
							language: baseFieldLocalization.language,
							label: baseFieldLocalization.label,
							description: baseFieldLocalization.description,
						});
					},
				),
			);
		}),
	);
};
