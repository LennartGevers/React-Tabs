import type { ReactElement, ReactNode } from 'react';

/**
 * Represents a tab instance managed by the {@link Tabs} controller.
 */
export interface TabInstance<Type extends string, State> {
  id: string;
  type: Type;
  state: State;
}

/**
 * API exposed to the render function of a {@link TabFeature}.
 */
export interface TabRenderContext<Tab extends TabInstance<string, unknown>> {
  tab: Tab;
  isActive: boolean;
  activate: () => void;
  close?: () => void;
}

/**
 * Configuration provided by a {@link TabFeature}.
 */
export interface TabFeatureProps<Type extends string, State> {
  type: Type;
  render: (context: TabRenderContext<TabInstance<Type, State>>) => ReactNode;
}

export type TabFeatureElement<Type extends string, State> = ReactElement<
  TabFeatureProps<Type, State>,
  typeof import('./TabFeature').TabFeature
>;

export type AnyTabFeatureElement = TabFeatureElement<string, unknown>;

export type TabUnion<Features extends readonly AnyTabFeatureElement[]> = Features[number] extends TabFeatureElement<
  infer Type,
  infer State
>
  ? TabInstance<Type, State>
  : never;

export type ExtractTabOfType<
  Tabs extends readonly TabInstance<string, unknown>[],
  Type extends Tabs[number]['type']
> = Extract<Tabs[number], { type: Type }>;

export interface TabsProps<Features extends readonly AnyTabFeatureElement[]> {
  tabs: readonly TabUnion<Features>[];
  activeTabId?: string;
  defaultActiveTabId?: string;
  onTabChange?: (tab: TabUnion<Features>) => void;
  onTabClose?: (tab: TabUnion<Features>) => void;
  children: Features;
  renderEmpty?: () => ReactNode;
}
