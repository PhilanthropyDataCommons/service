export type CoercedString = string | number | boolean;

export const coerceString = (str: string): CoercedString => {
	if (str === 'true') return true;
	if (str === 'false') return false;
	if (str === '') return str;
	const number = Number(str);
	if (!Number.isNaN(number) && Number.isFinite(number)) {
		return number;
	}
	return str;
};

export const coerceStrings = (strings: string[]): CoercedString[] =>
	strings.map(coerceString);
