import https from 'https';
import {
	isCopyBaseFieldsJobPayload,
	TaskStatus,
	isBaseField,
	BaseField,
} from '../types';
import {
	createOrUpdateBaseField,
	createOrUpdateBaseFieldLocalization,
	loadBaseFieldsCopyTask,
	updateBaseFieldsCopyTask,
} from '../database/operations';
import type { JobHelpers, Logger } from 'graphile-worker';

export const fetchBaseFieldsFromRemote = async (
	synchronizationUrl: string,
	logger: Logger,
): Promise<BaseField[]> =>
	new Promise((resolve, reject) => {
		https
			.get(`${synchronizationUrl}/baseFields`, (res) => {
				let data = '';

				res.on('data', (chunk) => {
					data += chunk;
				});

				res.on('end', () => {
					let parsedData: unknown;

					try {
						parsedData = JSON.parse(data);
					} catch (err) {
						logger.error(
							'Error parsing JSON response from remote PDC instance',
							{
								err,
							},
						);
						return reject(
							new Error(
								'Error parsing JSON or invalid data structure received from remote instance',
							),
						);
					}

					if (
						!Array.isArray(parsedData) ||
						!parsedData.every((item) => isBaseField(item))
					) {
						logger.error(
							'Invalid basefield data received from remote PDC instance',
							{
								parsedData,
							},
						);
						return reject(
							new Error('Invalid data received from remote PDC instance'),
						);
					}

					return resolve(parsedData);
				});
			})
			.on('error', (err) => {
				logger.error('Error connecting to remote PDC instance', { err });
				return reject(
					new Error(`Unable to connect to remote PDC instance: ${err.message}`),
				);
			});
	});

export const copyBaseFields = async (
	payload: unknown,
	helpers: JobHelpers,
): Promise<void> => {
	if (!isCopyBaseFieldsJobPayload(payload)) {
		helpers.logger.error('Malformed basefields copy job payload', {
			errors: isCopyBaseFieldsJobPayload.errors ?? [],
		});
		return;
	}
	helpers.logger.debug(
		`Started BasefieldsCopy Job for BaseFieldsCopyTask ID ${payload.baseFieldsCopyTaskId}`,
	);
	const baseFieldsCopyTask = await loadBaseFieldsCopyTask(
		payload.baseFieldsCopyTaskId,
	);

	if (baseFieldsCopyTask.status !== TaskStatus.PENDING) {
		helpers.logger.warn(
			'Basefields Copy cannot be processed because it is not in a PENDING state',
			{ baseFieldsCopyTask },
		);
		return;
	}

	let remoteBaseFields: BaseField[];
	let processBaseFieldsCopyTaskFailed = false;

	try {
		await updateBaseFieldsCopyTask(baseFieldsCopyTask.id, {
			status: TaskStatus.IN_PROGRESS,
			statusUpdatedAt: new Date(Date.now()).toISOString(),
		});

		remoteBaseFields = await fetchBaseFieldsFromRemote(
			baseFieldsCopyTask.synchronizationUrl,
			helpers.logger,
		);
	} catch (err) {
		helpers.logger.warn('Fetching data from remote instance failed', { err });
		await updateBaseFieldsCopyTask(baseFieldsCopyTask.id, {
			status: TaskStatus.FAILED,
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
		helpers.logger.info('Basefields copy has failed', { err });
		processBaseFieldsCopyTaskFailed = true;
	}

	if (processBaseFieldsCopyTaskFailed) {
		await updateBaseFieldsCopyTask(baseFieldsCopyTask.id, {
			status: TaskStatus.FAILED,
			statusUpdatedAt: new Date(Date.now()).toISOString(),
		});
	} else {
		await updateBaseFieldsCopyTask(baseFieldsCopyTask.id, {
			status: TaskStatus.COMPLETED,
			statusUpdatedAt: new Date(Date.now()).toISOString(),
		});
	}
};
