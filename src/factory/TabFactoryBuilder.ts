import { z } from 'zod';

import { TabFactory, type TabFactoryOptions } from './TabFactory';
import type { AnyTabPrototype } from './TabPrototype';

function assertObjectSchema(schema: AnyTabPrototype['schema']): z.ZodObject<any> {
  if (!(schema instanceof z.ZodObject)) {
    throw new Error(
      'TabFactoryBuilder requires each schema to be created via z.object so the key literal can be verified.'
    );
  }

  return schema;
}

function ensureSchemaHasLiteralKey(prototype: AnyTabPrototype): void {
  const schema = assertObjectSchema(prototype.schema);
  const keyShape = schema.shape.key;

  if (!keyShape) {
    throw new Error(
      `Schema for tab "${prototype.key}" must include a \`key\` field declared as z.literal('${prototype.key}').`
    );
  }

  if (!(keyShape instanceof z.ZodLiteral)) {
    throw new Error(
      `Schema for tab "${prototype.key}" must declare the key as a z.literal(...)`
    );
  }

  if (keyShape.value !== prototype.key) {
    throw new Error(
      `Schema key literal ("${keyShape.value}") does not match prototype key "${prototype.key}".`
    );
  }
}

export class TabFactoryBuilder<Prototypes extends readonly AnyTabPrototype[]> {
  private constructor(
    private readonly prototypes: Prototypes,
    private readonly keys: Set<string>
  ) {}

  public static create(): TabFactoryBuilder<[]> {
    return new TabFactoryBuilder<[]>([] as const, new Set());
  }

  public add<Prototype extends AnyTabPrototype>(
    prototype: Prototype
  ): TabFactoryBuilder<[...Prototypes, Prototype]> {
    if (this.keys.has(prototype.key)) {
      throw new Error(`Tab prototype with key "${prototype.key}" already exists.`);
    }

    ensureSchemaHasLiteralKey(prototype);

    const nextPrototypes = [...this.prototypes, prototype] as [...Prototypes, Prototype];
    const nextKeys = new Set(this.keys);
    nextKeys.add(prototype.key);

    return new TabFactoryBuilder(nextPrototypes, nextKeys);
  }

  public build(options?: TabFactoryOptions): TabFactory<Prototypes> {
    return new TabFactory(this.prototypes, options);
  }
}

export function createTabFactoryBuilder(): TabFactoryBuilder<[]> {
  return TabFactoryBuilder.create();
}
