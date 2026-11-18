import { MS_PER_SECOND } from '../constants';

const epochSecondsToIsoString = (epochSeconds: number): string =>
	new Date(epochSeconds * MS_PER_SECOND).toISOString();

export { epochSecondsToIsoString };
