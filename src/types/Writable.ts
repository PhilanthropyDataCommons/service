// This is a utility type definition and needs some weird / wonky types, so we need our linter to chill out
/* eslint-disable @typescript-eslint/no-type-alias */
/* eslint-disable @typescript-eslint/ban-types */

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
	[P in keyof T]: {} extends Pick<T, P> ? P : never;
}[keyof T];

type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>;

type WritablePrimitive =
	| undefined
	| null
	| boolean
	| string
	| number
	| Function;

export type Writable<T> = T extends WritablePrimitive
	? T
	: T extends Array<infer U>
		? Array<Writable<U>>
		: T extends Map<infer K, infer V>
			? Map<K, Writable<V>>
			: T extends Set<infer X>
				? Set<Writable<X>>
				: T extends Object
					? {
							// Capture required keys
							[K in keyof T & RequiredKeys<T> & WritableKeys<T>]: Writable<
								T[K]
							>;
						} & {
							// Capture optional keys
							[K in keyof T & OptionalKeys<T> & WritableKeys<T>]?: Writable<
								T[K]
							>;
						} extends infer O
						? {
								// Flatten the two types (required and optional) into a single combined type
								[K in keyof O]: O[K];
							}
						: never
					: T;
