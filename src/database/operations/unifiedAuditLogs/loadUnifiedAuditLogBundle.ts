import { generateLoadBundleOperation } from '../generators';
import type { UnifiedAuditLog } from '../../../types';

const loadUnifiedAuditLogBundle = generateLoadBundleOperation<
	UnifiedAuditLog,
	[]
>('unifiedAuditLogs.selectWithPagination', []);

export { loadUnifiedAuditLogBundle };
