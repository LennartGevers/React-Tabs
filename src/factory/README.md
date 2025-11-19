# Tab Factory

This directory provides a schema-driven `TabFactory` utility for rendering tabs from validated data definitions. Each tab pairs a unique key, a Zod schema that includes the literal key, and a render function that transforms parsed data into a React element.

## Usage

```tsx
import { z } from 'zod';
import {
  TabFactory,
  createTabFactoryBuilder,
  createTabPrototype,
} from '../factory';

const infoSchema = z.object({
  key: z.literal('info'),
  title: z.string(),
});

const infoTab = createTabPrototype({
  key: 'info',
  schema: infoSchema,
  render: ({ title }) => <h1>{title}</h1>,
});

const detailsSchema = z.object({
  key: z.literal('details'),
  description: z.string(),
});

const detailsTab = createTabPrototype({
  key: 'details',
  schema: detailsSchema,
  render: ({ description }) => <p>{description}</p>,
});

const factoryFromArray = new TabFactory([infoTab, detailsTab]);

const builder = createTabFactoryBuilder().add(infoTab).add(detailsTab);
const factoryFromBuilder = builder.build();

const element = factoryFromBuilder.render({ key: 'info', title: 'Welcome' });
```

Provide raw tab data to `render`, and the factory validates it against the discriminated union schema before invoking the appropriate renderer. Pass an `ErrorComponent` via the constructor options to render a fallback instead of throwing when validation fails.
