/* eslint-disable eslint-comments/require-description --
 * The work required to thoughtfully comment on each of these disables at this point is probably
 * similar to the work required to potentially refactor in a way that would remove the need to disable
 * the rule in the first place.
 * This represents known technical debt that we will address in the future.
 * See issue https://github.com/PhilanthropyDataCommons/service/issues/1730
 */
// This is a utility type definition and needs some weird / wonky types, so we need our linter to chill out
/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */

// This set of types is inspired by https://stackoverflow.com/a/62362197/159522
// The final `Writable` utility type will create a deep copy of a type with all
// `readonly` properties removed.
//
// Providing "Writable" versions of our models is important because we know that
// POST operations do not accept readonly model properties.
type IfEquals<X, Y, A = X, B = never> =
	(<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

type WritableKeys<T> = {
	[P in keyof T]: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P>;
}[keyof T];

type OptionalKeys<T> = {
	// map each attribute to either itself or never, depending on if it is optional
	[P in keyof T]: {} extends Pick<T, P>
		? P /* If an empty Object type extends a type that
		       only contains attribute P then we know attribute P is optional,
		       since {} extends { a?: string } but not { a: string } */
		: never; // otherwise don't keep it
}[keyof T]; /* Pull out the mapped attributes, which are now
               exclusively either "never" or the attributes with optional types) */

// By definition if a key is not optional then it is required.
// This means we can get the list of required keys by getting
// all keys and then removing any optional keys
type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>;

type WritablePrimitive =
	| undefined
	| null
	| boolean
	| string
	| number
	| Function;

type WritableObject<T> = {
	// Capture required keys
	[K in keyof T & RequiredKeys<T> & WritableKeys<T>]: Writable<T[K]>;
} & {
	// Capture optional keys
	[K in keyof T & OptionalKeys<T> & WritableKeys<T>]?: Writable<T[K]>;
} extends infer O
	? {
			// Flatten the two types (required and optional) into a single combined type
			[K in keyof O]: O[K];
		}
	: never;

export type Writable<T> = T extends WritablePrimitive
	? T
	: T extends Array<infer U>
		? Array<Writable<U>>
		: T extends Map<infer K, infer V>
			? Map<K, Writable<V>>
			: T extends Set<infer X>
				? Set<Writable<X>>
				: T extends Object
					? WritableObject<T>
					: T;
