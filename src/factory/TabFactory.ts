import { createElement, type ComponentType, type ReactElement } from 'react';
import { z } from 'zod';

export type ErrorComponentProps = { error?: string };

export interface TabFactoryOptions {
  readonly ErrorComponent?: ComponentType<ErrorComponentProps>;
}

type SchemaWithLiteralKey<Key extends string> = z.ZodType<
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

type AnyTabPrototype = TabPrototype<string, SchemaWithLiteralKey<string>>;
type PrototypeUnion<T extends readonly AnyTabPrototype[]> = T[number];
type PrototypeSchema<T> = T extends TabPrototype<any, infer Schema> ? Schema : never;
type SchemaTuple<T extends readonly AnyTabPrototype[]> = {
  [Index in keyof T]: PrototypeSchema<T[Index]>;
};
type PrototypeValue<T> = T extends TabPrototype<any, infer Schema>
  ? z.infer<Schema>
  : never;
type FactoryInput<T extends readonly AnyTabPrototype[]> = PrototypeValue<
  PrototypeUnion<T>
>;
type FactoryKey<T extends readonly AnyTabPrototype[]> = PrototypeUnion<T>["key"];
type PrototypeForKey<
  T extends readonly AnyTabPrototype[],
  Key extends FactoryKey<T>
> = Extract<PrototypeUnion<T>, { key: Key }>;
type FactoryInputByKey<
  T extends readonly AnyTabPrototype[],
  Key extends FactoryKey<T>
> = Extract<FactoryInput<T>, { key: Key }>;

export class TabFactory<Prototypes extends readonly AnyTabPrototype[]> {
  private readonly prototypeMap: Map<FactoryKey<Prototypes>, PrototypeUnion<Prototypes>>;
  private readonly unionSchema: z.ZodDiscriminatedUnion<
    'key',
    SchemaTuple<Prototypes>[number]
  >;
  private readonly ErrorComponent?: ComponentType<ErrorComponentProps>;

  constructor(prototypes: Prototypes, options?: TabFactoryOptions) {
    if (!prototypes.length) {
      throw new Error('TabFactory requires at least one tab prototype.');
    }

    this.prototypeMap = new Map(
      prototypes.map((prototype) => [prototype.key, prototype])
    );

    if (this.prototypeMap.size !== prototypes.length) {
      throw new Error('TabFactory prototypes must have unique keys.');
    }

    const schemas = prototypes.map((prototype) => prototype.schema) as SchemaTuple<Prototypes>;
    this.unionSchema = z.discriminatedUnion('key', schemas);
    this.ErrorComponent = options?.ErrorComponent;
  }

  public render(data: FactoryInput<Prototypes>): ReactElement;
  public render(data: unknown): ReactElement {
    try {
      const parsed = this.unionSchema.parse(data);
      const key = parsed.key as FactoryKey<Prototypes>;
      const prototype = this.getPrototype(key);

      if (!prototype) {
        throw new Error(`No tab prototype registered for key "${String(key)}".`);
      }

      return prototype.render(
        parsed as FactoryInputByKey<Prototypes, typeof key>
      );
    } catch (error) {
      if (this.ErrorComponent) {
        const ErrorComponent = this.ErrorComponent;
        return createElement(ErrorComponent, {
          error: this.serializeError(error),
        });
      }

      throw error;
    }
  }

  private getPrototype<Key extends FactoryKey<Prototypes>>(
    key: Key
  ): PrototypeForKey<Prototypes, Key> | undefined {
    return this.prototypeMap.get(key) as PrototypeForKey<Prototypes, Key> | undefined;
  }

  private serializeError(error: unknown): string | undefined {
    try {
      return JSON.stringify(
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error
      );
    } catch {
      return undefined;
    }
  }
}
