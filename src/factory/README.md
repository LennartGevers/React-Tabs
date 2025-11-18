# Tab Factory

This directory provides a schema-driven `TabFactory` utility for rendering tabs from validated data definitions. Each tab pairs a unique key, a Zod schema that includes the literal key, and a render function that transforms parsed data into a React element.

## Usage

```tsx
import { z } from 'zod';
import { TabFactory, type TabPrototype } from '../factory';

const infoSchema = z.object({
  key: z.literal('info'),
  title: z.string(),
});

const infoTab: TabPrototype<'info', typeof infoSchema> = {
  key: 'info',
  schema: infoSchema,
  render: ({ title }) => <h1>{title}</h1>,
};

const detailsSchema = z.object({
  key: z.literal('details'),
  description: z.string(),
});

const detailsTab: TabPrototype<'details', typeof detailsSchema> = {
  key: 'details',
  schema: detailsSchema,
  render: ({ description }) => <p>{description}</p>,
};

const tabs = new TabFactory([infoTab, detailsTab]);

const element = tabs.render({ key: 'info', title: 'Welcome' });
```

Provide raw tab data to `render`, and the factory validates it against the discriminated union schema before invoking the appropriate renderer. Pass an `ErrorComponent` via the constructor options to render a fallback instead of throwing when validation fails.
