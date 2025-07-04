import type { KeycloakId } from './KeycloakId';
import type { ShortCode } from './ShortCode';
import type { Writable } from './Writable';

interface FunderCollaborativeMember {
	readonly funderCollaborativeShortCode: ShortCode;
	readonly memberShortCode: ShortCode;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableFunderCollaborativeMember = Writable<FunderCollaborativeMember>;

type InternallyWritableFunderCollaborativeMember =
	WritableFunderCollaborativeMember &
		Pick<
			FunderCollaborativeMember,
			'funderCollaborativeShortCode' | 'memberShortCode'
		>;

export {
	type FunderCollaborativeMember,
	type InternallyWritableFunderCollaborativeMember,
};
