export interface PlatformProviderResponse {
	externalId: string;
	platformProvider: string;
	data: Record<string, unknown>;
	createdAt: Date;
}
