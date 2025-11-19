import { createElement, type ComponentType, type ReactElement } from 'react';
import { z } from 'zod';

import type {
  AnyTabPrototype,
  FactoryInput,
  FactoryInputByKey,
  FactoryKey,
  PrototypeForKey,
  PrototypeUnion,
  SchemaTuple,
} from './TabPrototype';

export type ErrorComponentProps = { error?: string };

export interface TabFactoryOptions {
  readonly ErrorComponent?: ComponentType<ErrorComponentProps>;
}

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

    // Build once so every render call benefits from the cached union schema.
    const schemas = prototypes.map((prototype) => prototype.schema) as SchemaTuple<Prototypes>;
    this.unionSchema = z.discriminatedUnion('key', schemas);
    this.ErrorComponent = options?.ErrorComponent;
  }

  public render(data: FactoryInput<Prototypes>): ReactElement;
  public render(data: unknown): ReactElement {
    try {
      // Parse with the discriminated union, which simultaneously validates the
      // payload and tells us which prototype to use.
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
      // Provide useful debugging info to the fallback component while keeping
      // the error serializable.
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
