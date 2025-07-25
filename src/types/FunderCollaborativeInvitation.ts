import { ajv } from '../ajv';
import type { ShortCode } from './ShortCode';
import type { KeycloakId } from './KeycloakId';
import type { Writable } from './Writable';
import type { JSONSchemaType } from 'ajv';

enum FunderCollaborativeInvitationStatus {
	PENDING = 'pending',
	ACCEPTED = 'accepted',
	REJECTED = 'rejected',
}

interface FunderCollaborativeInvitation {
	readonly funderCollaborativeShortCode: ShortCode;
	readonly invitedFunderShortCode: ShortCode;
	invitationStatus: FunderCollaborativeInvitationStatus;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableFunderCollaborativeInvitation =
	Writable<FunderCollaborativeInvitation>;

type InternallyWritableFunderCollaborativeInvitation =
	WritableFunderCollaborativeInvitation &
		Pick<
			FunderCollaborativeInvitation,
			'funderCollaborativeShortCode' | 'invitedFunderShortCode'
		>;

type FunderCollaborativeInvitationPost = Omit<
	WritableFunderCollaborativeInvitation,
	'invitationStatus'
>;

type FunderCollaborativeInvitationPatch = WritableFunderCollaborativeInvitation;

const FunderCollaborativeInvitationPostSchema: JSONSchemaType<FunderCollaborativeInvitationPost> =
	{
		type: 'object',
		properties: {},
	};

const isFunderCollaborativeInvitationPost = ajv.compile(
	FunderCollaborativeInvitationPostSchema,
);

const FunderCollaborativeInvitationPatchSchema: JSONSchemaType<FunderCollaborativeInvitationPatch> =
	{
		type: 'object',
		properties: {
			invitationStatus: {
				type: 'string',
				enum: Object.values(FunderCollaborativeInvitationStatus),
			},
		},
		required: ['invitationStatus'],
	};

const isFunderCollaborativeInvitationPatch = ajv.compile(
	FunderCollaborativeInvitationPatchSchema,
);

export {
	type FunderCollaborativeInvitation,
	type InternallyWritableFunderCollaborativeInvitation,
	type FunderCollaborativeInvitationPost,
	type FunderCollaborativeInvitationPatch,
	type WritableFunderCollaborativeInvitation,
	FunderCollaborativeInvitationStatus,
	FunderCollaborativeInvitationPostSchema,
	FunderCollaborativeInvitationPatchSchema,
	isFunderCollaborativeInvitationPost,
	isFunderCollaborativeInvitationPatch,
};
