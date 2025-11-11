import * as React from "react";
import { useTabsStore } from "./store";
import { InternalEnvContext } from "./feature";
import type { TabFeatureAny } from "./types";

// Turn a tuple of features into a typed registry
type RegistryFromTuple<T extends readonly TabFeatureAny[]> =
  T[number] extends infer F
    ? F extends TabFeatureAny
      ? Record<F["key"], F>
      : never
    : never;

export type TabRouterProps<TContext, T extends readonly TabFeatureAny[]> = {
  id: string | null; // active tab id (state managed by TanStack Router’s url state)
  context: TContext; // shared global context
  onNavigate: (to: string | null) => void; // integrate with TanStack Router
  features: T; // tuple: e.g. [plotFeature, tableFeature] as const

  FallbackLoading?: React.ComponentType;
  FallbackError?: React.ComponentType<{ error: unknown }>;
};

export function TabRouter<TContext, T extends readonly TabFeatureAny[]>({
  id,
  context,
  onNavigate,
  features,
  FallbackLoading,
  FallbackError,
}: TabRouterProps<TContext, T>) {
  const tab = useTabsStore((s) => (id ? s.tabs[id] : null));

  // Build strongly typed registry once
  const registry = React.useMemo(() => {
    const map = {} as RegistryFromTuple<typeof features>;
    for (const f of features) {
      // @ts-expect-error index by branded key at runtime
      // (Indexing with a branded string is safe at runtime but imperfectly modeled in TS)
      map[f.key] = f;
    }
    return map;
  }, [features]);

  if (!id || !tab) return null;

  // TODO: Handle tab.featureKey not in registry by giving explicit error details.
  const feature = registry[tab.featureKey as keyof typeof registry] as
    | (typeof features)[number]
    | undefined;
  if (!feature) return null;

  const env = React.useMemo(
    () => ({
      currentTabId: id,
      globalContext: context,
      navigate: onNavigate,
    }),
    [id, context, onNavigate]
  );

  return (
    <InternalEnvContext.Provider value={env}>
      <feature.View
        FallbackLoading={FallbackLoading}
        FallbackError={FallbackError}
      />
    </InternalEnvContext.Provider>
  );
}
