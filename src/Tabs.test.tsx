import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TabFeature, Tabs } from './index';

describe('Tabs', () => {
  it('renders each tab with the matching feature', () => {
    const tabs = [
      { id: 'profile-1', type: 'profile', state: { userId: '123' } },
      { id: 'settings-1', type: 'settings', state: { section: 'general' } },
    ] as const;

    const { getByRole, getByText } = render(
      <Tabs tabs={tabs} defaultActiveTabId="profile-1">
        <TabFeature
          type="profile"
          render={({ tab, isActive, activate }) => (
            <button type="button" onClick={activate} aria-pressed={isActive}>
              Profile {tab.state.userId}
            </button>
          )}
        />
        <TabFeature
          type="settings"
          render={({ tab }) => <span>Settings: {tab.state.section}</span>}
        />
      </Tabs>,
    );

    expect(getByRole('button', { name: /Profile 123/i })).toBeTruthy();
    expect(getByText(/Settings: general/i)).toBeTruthy();
  });

  it('exposes activate and close callbacks', () => {
    const tabs = [{ id: 'profile-1', type: 'profile', state: { userId: '123' } }] as const;
    const handleChange = vi.fn();
    const handleClose = vi.fn();

    const { getByRole } = render(
      <Tabs tabs={tabs} onTabChange={handleChange} onTabClose={handleClose}>
        <TabFeature
          type="profile"
          render={({ activate, close, isActive }) => (
            <button
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                activate();
                close?.();
              }}
            >
              Toggle
            </button>
          )}
        />
      </Tabs>,
    );

    fireEvent.click(getByRole('button', { name: /Toggle/i }));

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'profile-1', type: 'profile' }),
    );
    expect(handleClose).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'profile-1', type: 'profile' }),
    );
  });
});
