import { createChangemaker, updateChangemaker } from '..';
import { stringToKeycloakId } from '../../../../types';
import { db } from '../../../db';

describe('updateChangemaker', () => {
	it('Successfully sets a keycloakOrganizationId where previously null', async () => {
		const changemaker = await createChangemaker(db, null, {
			taxId: '4833091201209397622311990956044204588593',
			name: 'Changemaker 4833091201209397622311990956044204588593',
			keycloakOrganizationId: null,
		});
		const newOrganizationId = stringToKeycloakId(
			'64e6da25-a6ba-43ce-97ba-1c5958bcc7ae',
		);
		const result = await updateChangemaker(
			db,
			null,
			{ keycloakOrganizationId: newOrganizationId },
			changemaker.id,
		);
		expect(result).toStrictEqual({
			...changemaker,
			keycloakOrganizationId: newOrganizationId,
		});
	});

	it('Successfully sets a keycloakOrganizationId where previously non-null', async () => {
		const changemaker = await createChangemaker(db, null, {
			taxId: '1099594605318784561881495063299923285326',
			name: 'Changemaker 1099594605318784561881495063299923285326',
			keycloakOrganizationId: '7733cef4-8a08-4089-a699-9be1e5536733',
		});
		const newOrganizationId = stringToKeycloakId(
			'0a78a90b-b2fe-42d0-8c46-b5ce959d6f24',
		);
		const result = await updateChangemaker(
			db,
			null,
			{ keycloakOrganizationId: newOrganizationId },
			changemaker.id,
		);
		expect(result).toStrictEqual({
			...changemaker,
			keycloakOrganizationId: newOrganizationId,
		});
	});

	it('Throws Error when the changemaker id does not exist', async () => {
		const newOrganizationId = stringToKeycloakId(
			'1377aea8-0ef5-4e0f-8beb-a799a93e898b',
		);
		const result = updateChangemaker(
			db,
			null,
			{ keycloakOrganizationId: newOrganizationId },
			65222406,
		);
		await expect(async () => {
			await result;
		}).rejects.toThrowError();
	});
});
