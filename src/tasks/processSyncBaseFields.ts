import https from 'https';
import {
	isSyncBaseFieldJobPayload,
	SyncBasefieldStatus,
	isWritableBaseFieldWithLocalizationsContextArray,
	type WritableBaseFieldWithLocalizationsContextArray,
} from '../types';
import {
	createOrUpdateBaseField,
	createOrUpdateBaseFieldLocalization,
	loadSyncBaseField,
	updateSyncBaseField,
} from '../database/operations';
import type { JobHelpers } from 'graphile-worker';

export const fetchBaseFieldsFromRemote = async (
	synchronizationUrl: string,
): Promise<WritableBaseFieldWithLocalizationsContextArray> =>
	new Promise((resolve, reject) => {
		https
			.get(`${synchronizationUrl}/baseFields`, (res) => {
				let data = '';
				res.on('data', (chunk) => {
					data += chunk;
				});
				res.on('end', () => {
					try {
						const parsedData = JSON.parse(data) as unknown;
						if (!isWritableBaseFieldWithLocalizationsContextArray(parsedData)) {
							throw new Error('Invalid data received from remote pdc instance');
						}
						resolve(parsedData);
					} catch (err) {
						reject(
							new Error(
								'Error parsing JSON or invalid data structure recieved from remote instance',
							),
						);
					}
				});
			})
			.on('error', (err) =>
				reject(new Error('Unable to connect to remote pdc instance', err)),
			);
	});

export const processSyncBaseFields = async (
	payload: unknown,
	helpers: JobHelpers,
): Promise<void> => {
	if (!isSyncBaseFieldJobPayload(payload)) {
		helpers.logger.error('Malformed sync basefield job payload', {
			errors: isSyncBaseFieldJobPayload.errors ?? [],
		});
		return;
	}
	helpers.logger.debug(
		`Started syncBaseField Job for syncBaseField ID ${payload.syncBaseFieldId}`,
	);
	const syncBaseField = await loadSyncBaseField(payload.syncBaseFieldId);

	if (syncBaseField.status !== SyncBasefieldStatus.PENDING) {
		helpers.logger.warn(
			'Sync BaseField cannot be processed because it is not in a PENDING state',
			{ syncBaseField },
		);
		return;
	}

	let remoteBaseFields: WritableBaseFieldWithLocalizationsContextArray;
	let syncBaseFieldHasFailed = false;

	try {
		await updateSyncBaseField(syncBaseField.id, {
			status: SyncBasefieldStatus.IN_PROGRESS,
			statusUpdatedAt: new Date(Date.now()).toISOString(),
		});

		remoteBaseFields = await fetchBaseFieldsFromRemote(
			syncBaseField.synchronizationUrl,
		);
	} catch (err) {
		helpers.logger.warn('Fetching data from remote instance failed', { err });
		await updateSyncBaseField(syncBaseField.id, {
			status: SyncBasefieldStatus.FAILED,
			statusUpdatedAt: new Date(Date.now()).toISOString(),
		});
		return;
	}

	try {
		await Promise.all(
			remoteBaseFields.map<Promise<void>>(async (baseField) => {
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
	} catch (err) {
		helpers.logger.info('Sync BaseFields has failed', { err });
		syncBaseFieldHasFailed = true;
	}

	if (syncBaseFieldHasFailed) {
		await updateSyncBaseField(syncBaseField.id, {
			status: SyncBasefieldStatus.FAILED,
			statusUpdatedAt: new Date(Date.now()).toISOString(),
		});
	} else {
		await updateSyncBaseField(syncBaseField.id, {
			status: SyncBasefieldStatus.COMPLETED,
			statusUpdatedAt: new Date(Date.now()).toISOString(),
		});
	}
};
