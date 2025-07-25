import { isCopyBaseFieldsJobPayload, TaskStatus, isBaseField } from '../types';
import { db } from '../database/db';
import {
	createOrUpdateBaseField,
	createOrUpdateBaseFieldLocalization,
	loadBaseFieldsCopyTask,
	updateBaseFieldsCopyTask,
} from '../database/operations';
import type { BaseField } from '../types';
import type { JobHelpers, Logger } from 'graphile-worker';

export const fetchBaseFieldsFromRemote = async (
	pdcApiUrl: string,
	logger: Logger,
): Promise<BaseField[]> => {
	try {
		const response = await fetch(`${pdcApiUrl}/baseFields`);

		if (!response.ok) {
			logger.error('Failed to fetch base fields from remote PDC instance', {
				status: response.status,
				statusText: response.statusText,
			});
			throw new Error(
				`Failed to fetch base fields: ${response.status} ${response.statusText}`,
			);
		}

		const data = await response.json();

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

const copyBaseField = async (targetBaseField: BaseField): Promise<void> => {
	const {
		category,
		dataType,
		shortCode,
		label,
		description,
		valueRelevanceHours,
		sensitivityClassification,
	} = targetBaseField;
	const copiedBaseField = await createOrUpdateBaseField(db, null, {
		category,
		dataType,
		shortCode,
		label,
		description,
		valueRelevanceHours,
		sensitivityClassification,
	});
	await Promise.all(
		Object.entries(targetBaseField.localizations).map(
			async ([language, baseFieldLocalization]) => {
				await createOrUpdateBaseFieldLocalization(db, null, {
					baseFieldShortCode: copiedBaseField.shortCode,
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
		db,
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

	let taskFailed = false;

	await updateBaseFieldsCopyTask(
		db,
		null,
		{
			status: TaskStatus.IN_PROGRESS,
		},
		baseFieldsCopyTask.id,
	);

	const remoteBaseFields = await fetchBaseFieldsFromRemote(
		baseFieldsCopyTask.pdcApiUrl,
		helpers.logger,
	).catch(async (err: unknown) => {
		helpers.logger.warn('Fetching data from remote instance failed', { err });
		await updateBaseFieldsCopyTask(
			db,
			null,
			{
				status: TaskStatus.FAILED,
			},
			baseFieldsCopyTask.id,
		);
	});

	if (remoteBaseFields === undefined) {
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
		await updateBaseFieldsCopyTask(
			db,
			null,
			{
				status: TaskStatus.FAILED,
			},
			baseFieldsCopyTask.id,
		);
	} else {
		await updateBaseFieldsCopyTask(
			db,
			null,
			{
				status: TaskStatus.COMPLETED,
			},
			baseFieldsCopyTask.id,
		);
	}
};
