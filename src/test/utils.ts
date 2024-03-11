export const isoTimestampPattern =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3,6}(Z|(\+|-)\d{2}:\d{2})$/;

export const expectTimestamp = expect.stringMatching(
	isoTimestampPattern,
) as string;
