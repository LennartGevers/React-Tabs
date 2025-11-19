import { type ReactElement } from 'react';
import { z } from 'zod';

// Schemas must carry their literal key so that the discriminated union can
// narrow values back to the correct prototype at runtime.
export type SchemaWithLiteralKey<Key extends string> = z.ZodType<
  { key: Key } & Record<string, unknown>
>;

export interface TabPrototype<
  Key extends string,
  Schema extends SchemaWithLiteralKey<Key>
> {
  readonly key: Key;
  readonly schema: Schema;
  readonly render: (value: z.infer<Schema>) => ReactElement;
}

export type AnyTabPrototype = TabPrototype<string, SchemaWithLiteralKey<string>>;
export type PrototypeUnion<T extends readonly AnyTabPrototype[]> = T[number];
export type PrototypeSchema<T> = T extends TabPrototype<any, infer Schema>
  ? Schema
  : never;
// Preserve tuple-ness so `z.discriminatedUnion` receives strongly typed schemas.
export type SchemaTuple<T extends readonly AnyTabPrototype[]> = {
  [Index in keyof T]: PrototypeSchema<T[Index]>;
};
export type PrototypeValue<T> = T extends TabPrototype<any, infer Schema>
  ? z.infer<Schema>
  : never;
export type FactoryInput<T extends readonly AnyTabPrototype[]> = PrototypeValue<
  PrototypeUnion<T>
>;
export type FactoryKey<T extends readonly AnyTabPrototype[]> = PrototypeUnion<T>["key"];
export type PrototypeForKey<
  T extends readonly AnyTabPrototype[],
  Key extends FactoryKey<T>
> = Extract<PrototypeUnion<T>, { key: Key }>;
export type FactoryInputByKey<
  T extends readonly AnyTabPrototype[],
  Key extends FactoryKey<T>
> = Extract<FactoryInput<T>, { key: Key }>;

export function createTabPrototype<
  Key extends string,
  Schema extends SchemaWithLiteralKey<Key>
>(prototype: TabPrototype<Key, Schema>): TabPrototype<Key, Schema> {
  return prototype;
}
