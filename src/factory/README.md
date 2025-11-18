# Tab Factory

This directory provides a schema-driven `TabFactory` utility for rendering tabs from validated data definitions. Each tab pairs a unique key, a Zod schema that includes the literal key, and a render function that transforms parsed data into a React element.

## Usage

```tsx
import { z } from 'zod';
import { TabFactory } from '../factory/TabFactory';

const infoTab = {
  key: 'info',
  schema: z.object({
    key: z.literal('info'),
    title: z.string(),
  }),
  render: ({ title }) => <h1>{title}</h1>,
} as const;

const detailsTab = {
  key: 'details',
  schema: z.object({
    key: z.literal('details'),
    description: z.string(),
  }),
  render: ({ description }) => <p>{description}</p>,
} as const;

const tabs = new TabFactory([infoTab, detailsTab]);

const element = tabs.render({ key: 'info', title: 'Welcome' });
```

Provide raw tab data to `render`, and the factory validates it against the discriminated union schema before invoking the appropriate renderer. Pass an `ErrorComponent` via the constructor options to render a fallback instead of throwing when validation fails.
