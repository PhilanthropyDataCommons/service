import { KeycloakId } from './KeycloakId';

interface UnifiedAuditLog {
	readonly statementTimestamp: string;
	readonly userKeycloakId: KeycloakId | null;
	readonly userIsAdministrator: boolean | null;
	readonly pid: number;
	readonly auditLevel: number;
	readonly operation: string;
	readonly details: object | null;
}

export { UnifiedAuditLog };
