import type { ShallowChangemaker } from './Changemaker';
import type { DataProvider } from './DataProvider';
import type { Funder } from './Funder';
import type { KeycloakId } from './KeycloakId';
import type { User } from './User';

/** An organization may have zero to three functions (changemaker, funder, data provider). */
interface Organization {
	readonly keycloakOrganizationId: KeycloakId;
	readonly keycloakOrganizationName: string | null;
	readonly disabledAt: string | null;
	readonly changemaker: ShallowChangemaker | null;
	readonly dataProvider: DataProvider | null;
	readonly funder: Funder | null;
	readonly members: User[] | null;
	readonly formerMembers: User[] | null;
}

export { type Organization };
