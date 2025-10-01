import type { JSX } from 'react';
import type { TabFeatureProps } from './types';

function TabFeatureComponent<Type extends string, State>(
  _: TabFeatureProps<Type, State>,
): JSX.Element | null {
  return null;
}

TabFeatureComponent.displayName = 'TabFeature';

export const TabFeature = TabFeatureComponent;

export type { TabFeatureProps } from './types';
