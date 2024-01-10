export const isoTimestampPattern =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export const expectTimestamp = expect.stringMatching(
	isoTimestampPattern,
) as string;
