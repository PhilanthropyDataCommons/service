import fetch from 'node-fetch';
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
import type { Response } from 'node-fetch';

export const fetchBaseFieldsFromRemote = async (
	pdcApiUrl: string,
	logger: Logger,
): Promise<BaseField[]> => {
	try {
		const response = (await fetch(
			`${pdcApiUrl}/baseFields`,
		)) as unknown as Response;

		if (!response.ok) {
			logger.error('Failed to fetch base fields from remote PDC instance', {
				status: response.status,
				statusText: response.statusText,
			});
			throw new Error(
				`Failed to fetch base fields: ${response.status} ${response.statusText}`,
			);
		}

		const data = (await response.json()) as unknown;

		if (!Array.isArray(data) || !data.every((item) => isBaseField(item))) {
			logger.error('Invalid basefield data received from remote PDC instance', {
				data,
			});
			throw new Error('Invalid data received from remote PDC instance');
		}

		return data;
	} catch (err) {
		logger.error('Error fetching base fields from remote PDC instance', {
			err,
		});
		throw new Error('An error occurred while fetching base fields', {
			cause: err,
		});
	}
};

const copyBaseField = async (targetBaseField: BaseField) => {
	const { scope, dataType, shortCode, label, description } = targetBaseField;
	const copiedBaseField = await createOrUpdateBaseField({
		scope,
		dataType,
		shortCode,
		label,
		description,
	});
	await Promise.all(
		Object.entries(targetBaseField.localizations).map(
			async ([language, baseFieldLocalization]) => {
				await createOrUpdateBaseFieldLocalization({
					baseFieldId: copiedBaseField.id,
					language,
					label: baseFieldLocalization.label,
					description: baseFieldLocalization.description,
				});
			},
		),
	);
};

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
		null,
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
	let taskFailed = false;

	await updateBaseFieldsCopyTask(baseFieldsCopyTask.id, {
		status: TaskStatus.IN_PROGRESS,
	});

	try {
		remoteBaseFields = await fetchBaseFieldsFromRemote(
			baseFieldsCopyTask.pdcApiUrl,
			helpers.logger,
		);
	} catch (err) {
		helpers.logger.warn('Fetching data from remote instance failed', { err });
		await updateBaseFieldsCopyTask(baseFieldsCopyTask.id, {
			status: TaskStatus.FAILED,
		});
		return;
	}

	try {
		await Promise.all(
			remoteBaseFields.map<Promise<void>>(async (baseField) => {
				await copyBaseField(baseField);
			}),
		);
	} catch (err) {
		helpers.logger.info('Basefields copy has failed', { err });
		taskFailed = true;
	}

	if (taskFailed) {
		await updateBaseFieldsCopyTask(baseFieldsCopyTask.id, {
			status: TaskStatus.FAILED,
		});
	} else {
		await updateBaseFieldsCopyTask(baseFieldsCopyTask.id, {
			status: TaskStatus.COMPLETED,
		});
	}
};
