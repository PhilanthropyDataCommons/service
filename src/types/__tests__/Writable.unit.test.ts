import { expectTypeOf } from 'expect-type';
import type { Writable } from '../Writable';

describe('Writable', () => {
	it('should remove readonly parameters', () => {
		interface Foo {
			readonly a: string;
			b: number;
		}
		const writable: Writable<Foo> = { b: 42 };
		expectTypeOf(writable).toEqualTypeOf<{ b: number }>();
	});

	it('should keep writable parameters', () => {
		interface Foo {
			readonly a: string;
			b: number;
			c: boolean;
		}
		const writable: Writable<Foo> = {
			b: 42,
			c: true,
		};
		expectTypeOf(writable).toEqualTypeOf<{ b: number; c: boolean }>();
	});

	it('should convert Array attributes to have Array item types as Writable', () => {
		interface Foo {
			readonly a: string;
			b: number;
		}
		interface Bar {
			a: Foo[];
		}
		const writable: Writable<Bar> = {
			a: [{ b: 42 }],
		};
		expectTypeOf(writable).toEqualTypeOf<{ a: { b: number }[] }>();
	});

	it('should convert Set attributes to have the Set item types as Writable', () => {
		interface Foo {
			readonly a: string;
			b: number;
		}
		interface Bar {
			a: Set<Foo>;
		}
		const writable: Writable<Bar> = {
			a: new Set([{ b: 42 }]),
		};
		expectTypeOf(writable).toEqualTypeOf<{ a: Set<{ b: number }> }>();
	});

	it('should convert Map attributes to have the Map value types as Writable', () => {
		interface Foo {
			readonly a: string;
			b: number;
		}
		interface Bar {
			a: Map<string, Foo>;
		}
		const writable: Writable<Bar> = {
			a: new Map([['baz', { b: 42 }]]),
		};
		expectTypeOf(writable).toEqualTypeOf<{ a: Map<string, { b: number }> }>();
	});

	it('should support optional parameters', () => {
		interface Foo {
			readonly a: string;
			b?: number;
		}
		const writable: Writable<Foo> = {};
		expectTypeOf(writable).toEqualTypeOf<{ b?: number }>();
	});
});
