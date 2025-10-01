# Headless Tabs

A small, headless controller for orchestrating tabbed workflows in React applications. The library ships two components – `Tabs` and `TabFeature` – that work together similarly to `Router`/`Route`: declare the shape of each supported tab via `TabFeature` and feed the `Tabs` controller with the active tab instances.

## Installation

```bash
npm install @acme/headless-tabs
```

## Quick start

```tsx
import { TabFeature, Tabs } from '@acme/headless-tabs';

type ProfileTab = {
  id: string;
  type: 'profile';
  state: { userId: string };
};

type SettingsTab = {
  id: string;
  type: 'settings';
  state: { section: 'general' | 'notifications' };
};

type MyTab = ProfileTab | SettingsTab;

const activeTabs: MyTab[] = [
  { id: '1', type: 'profile', state: { userId: '123' } },
  { id: '2', type: 'settings', state: { section: 'general' } },
];

export function Example() {
  return (
    <Tabs tabs={activeTabs} defaultActiveTabId="1">
      <TabFeature
        type="profile"
        render={({ tab, isActive, activate }) => (
          <button onClick={activate} aria-pressed={isActive}>
            Profile for {tab.state.userId}
          </button>
        )}
      />

      <TabFeature
        type="settings"
        render={({ tab, isActive, activate }) => (
          <button onClick={activate} aria-pressed={isActive}>
            Settings ({tab.state.section})
          </button>
        )}
      />
    </Tabs>
  );
}
```

The `Tabs` component enforces that the `tabs` prop matches the union of tab shapes declared via `TabFeature`. Each feature provides a `render` callback that receives:

- `tab`: The strongly typed tab instance.
- `isActive`: Whether the tab is the currently selected tab.
- `activate()`: Function that selects the tab.
- `close?()`: Function that requests the tab to be closed (only provided when `onTabClose` is supplied on `Tabs`).

### Controlled vs uncontrolled

Provide `activeTabId` to control which tab is active. Alternatively, use `defaultActiveTabId` for uncontrolled usage. `onTabChange` fires whenever the active tab changes.

### Handling tab closure

Pass an `onTabClose` handler to react to tab close requests. When omitted the `close` handler will be `undefined`, allowing features to hide close affordances entirely.

## API

### `<Tabs />`

| Prop | Type | Description |
| --- | --- | --- |
| `tabs` | `TabUnion<typeof children>[]` | Collection of tab instances to display. |
| `activeTabId` | `string` | (Controlled) identifier of the active tab. |
| `defaultActiveTabId` | `string` | Initial active tab in uncontrolled mode. |
| `onTabChange` | `(tab) => void` | Called when a different tab becomes active. |
| `onTabClose` | `(tab) => void` | Called when a tab requests to be closed. |
| `renderEmpty` | `() => ReactNode` | Rendered when `tabs` is empty. |

### `<TabFeature />`

| Prop | Type | Description |
| --- | --- | --- |
| `type` | `string` | Discriminator linking a tab instance with its feature. |
| `render` | `(context) => ReactNode` | Render logic for the tab instance. |

## License

MIT
