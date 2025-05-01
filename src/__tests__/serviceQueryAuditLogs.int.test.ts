// The unusual import of @jest/globals is to help @typescript-eslint
// not complain about `expect.any(Number)` below in the test assertion.
import { expect } from '@jest/globals';
import { db } from '../database/db';
import { createServiceQueryAuditLog } from '../database/operations/serviceQueryAuditLogs';
import { loadUnifiedAuditLogBundle } from '../database/operations/unifiedAuditLogs';
import {
	expectTimestamp,
	getTestAuthContext,
	NO_LIMIT,
	NO_OFFSET,
} from '../test/utils';

describe('service query audit logs', () => {
	it('appears in logs when createServiceQueryAuditLog is called', async () => {
		const authContext = await getTestAuthContext(false);
		const administratorAuthContext = await getTestAuthContext(true);
		const queryParameters = {
			keyOne: 'Value 1 of Pretend query 5099',
			keyTwo: 'Value 2 of Pretend query 5099',
		};
		await createServiceQueryAuditLog(db, authContext, {
			queryName: 'Pretend query 5099',
			queryParameters,
		});
		const unifiedAuditLogsViewRows = await loadUnifiedAuditLogBundle(
			db,
			administratorAuthContext,
			NO_LIMIT,
			NO_OFFSET,
		);
		expect(unifiedAuditLogsViewRows.entries).toContainEqual({
			statementTimestamp: expectTimestamp,
			userKeycloakUserId: authContext.user.keycloakUserId,
			userIsAdministrator: false,
			pid: expect.any(Number),
			auditLevel: 2,
			operation: 'Called query Pretend query 5099',
			details: queryParameters,
		});
	});
});
