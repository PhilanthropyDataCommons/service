import { ajv } from '../ajv';
import { shortCodeSchema, type ShortCode } from './ShortCode';
import type { KeycloakId } from './KeycloakId';
import type { Writable } from './Writable';
import type { JSONSchemaType } from 'ajv';

enum FunderCollaborativeInvitationStatus {
	PENDING = 'pending',
	ACCEPTED = 'accepted',
	REJECTED = 'rejected',
}

interface FunderCollaborativeInvitation {
	readonly funderShortCode: ShortCode;
	readonly invitationShortCode: ShortCode;
	readonly invitationStatus: FunderCollaborativeInvitationStatus;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableFunderCollaborativeInvitation =
	Writable<FunderCollaborativeInvitation> &
		Pick<
			FunderCollaborativeInvitation,
			'invitationStatus' | 'invitationShortCode'
		>;

type InternallyWritableFunderCollaborativeInvitation =
	WritableFunderCollaborativeInvitation &
		Pick<FunderCollaborativeInvitation, 'funderShortCode'>;

type WritableFunderCollaborativeInvitationForPatch =
	Writable<FunderCollaborativeInvitation> &
		Pick<FunderCollaborativeInvitation, 'invitationStatus'>;

const writableFunderCollaborativeInvitationSchema: JSONSchemaType<WritableFunderCollaborativeInvitation> =
	{
		type: 'object',
		properties: {
			invitationShortCode: {
				...shortCodeSchema,
			},
			invitationStatus: {
				type: 'string',
				enum: Object.values(FunderCollaborativeInvitationStatus),
			},
		},
		required: ['invitationStatus', 'invitationShortCode'],
	};

const isWritableFunderCollaborativeInvitation = ajv.compile(
	writableFunderCollaborativeInvitationSchema,
);

const writableFunderCollaborativeInvitationForPatchSchema: JSONSchemaType<WritableFunderCollaborativeInvitationForPatch> =
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

const isWritableFunderCollaborativeInvitationForPatch = ajv.compile(
	writableFunderCollaborativeInvitationForPatchSchema,
);

export {
	type FunderCollaborativeInvitation,
	type InternallyWritableFunderCollaborativeInvitation,
	FunderCollaborativeInvitationStatus,
	isWritableFunderCollaborativeInvitation,
	isWritableFunderCollaborativeInvitationForPatch,
};
