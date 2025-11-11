import * as React from "react";
import { z } from "zod";
import { useQuery, QueryKey } from "@tanstack/react-query";
import type { FeatureKey, Tab, TabFeature } from "./types";

// Internal environment (shared global context + router navigation + active tab id)
type InternalEnv<TContext> = {
  globalContext: TContext;
  navigate: (to: string | null) => void;
  currentTabId: string | null;
};

export const InternalEnvContext = React.createContext<InternalEnv<any> | null>(
  null
);

// Public spec
export interface TabSpec<
  TSettings,
  TLoaderDeps,
  TLoaderData,
  TContext,
  TMeta,
  K extends string = string
> {
  key: FeatureKey<K>;
  schema: z.ZodType<TSettings, ZodTypeDef, TSettings>;
  component: () => React.ReactNode; // only rendered on success
  metaSchema?: z.ZodType<TMeta, ZodTypeDef, TMeta>;
  loadingComponent?: () => React.ReactNode;
  errorComponent?: (p: { error: unknown }) => React.ReactNode;
  loaderDataDeps: (opts: {
    context: TContext;
    tab: Tab<TSettings>;
  }) => TLoaderDeps;
  loaderData: (deps: TLoaderDeps) => Promise<TLoaderData>;

  onClose?: (tab: Tab<TSettings>, ctx: TContext) => Promise<void> | void;
  onPersist?: (tab: Tab<TSettings>, ctx: TContext) => Promise<void> | void;
}

export function createTabFeature<
  TSettings,
  TLoaderDeps,
  TLoaderData,
  TContext,
  TMeta,
  K extends string
>(
  opts: TabSpec<TSettings, TLoaderDeps, TLoaderData, TContext, TMeta, K>
): TabFeature<TSettings, TLoaderDeps, TLoaderData, TContext, K> {
  const featureContext = React.createContext<{
    tabsContext: TContext;
    loaderData: TLoaderData;
    tabData: Tab<TSettings>;
    metaData: TMeta;
  }>(null!);

  const tabsContext = React.createContext<{
    addTab: (t: Tab<TSettings>) => void;
    updateTab: (
      id: string,
      updater: (t: Tab<TSettings>) => Tab<TSettings>
    ) => void;
    deleteTab: (id: string) => void;
  }>(null!);

  const useEnv = (): InternalEnv<TContext> => {
    const env = React.useContext(InternalEnvContext);
    if (!env) throw new Error("TabRouter environment not found.");
    return env;
  };

  const useContext = () => useEnv().globalContext;

  const useTab = () => {
    const { currentTabId } = useEnv();
    const tab = useTabsStore((s) =>
      currentTabId ? s.tabs[currentTabId] : null
    );
    if (!tab) throw new Error("No active tab.");
    if ((tab as Tab<any>).featureKey !== opts.key)
      throw new Error(
        `Tab feature mismatch: ${(tab as Tab<any>).featureKey as string} !== ${
          opts.key as string
        }`
      );
    return tab as Tab<TSettings>;
  };

  const useAddTab = () =>
    useTabsStore((s) => s.addTab) as (t: Tab<TSettings>) => void;
  const useUpdateTab = () =>
    useTabsStore((s) => s.updateTab) as (
      id: string,
      u: (t: Tab<TSettings>) => Tab<TSettings>
    ) => void;
  const useDeleteTab = () =>
    useTabsStore((s) => s.deleteTab) as (id: string) => void;

  const useLoaderData = (): TLoaderData => {
    const ctx = React.useContext(featureContext);
    if (!ctx)
      throw new Error("useLoaderData must be used within a feature View.");
    return ctx.loaderData;
  };

  const View: TabFeature<
    TSettings,
    TLoaderDeps,
    TLoaderData,
    TContext,
    K
  >["View"] = ({ FallbackLoading, FallbackError }) => {
    const { currentTabId, globalContext } = useEnv();
    const setLoaderStatus = useTabsStore((s) => s.setLoaderStatus);
    const tab = useTabsStore((s) =>
      currentTabId ? s.tabs[currentTabId] : null
    ) as Tab<TSettings> | null;

    if (!currentTabId || !tab) return null;

    const deps = React.useMemo(
      () => opts.loaderDataDeps({ context: globalContext, tab }),
      [globalContext, tab]
    );
    const qKey: QueryKey = React.useMemo(
      () => [opts.key, tab.id, "loader", deps] as const,
      [tab.id, deps]
    );

    const query = (useQuery as typeof import("@tanstack/react-query").useQuery)(
      {
        queryKey: qKey,
        queryFn: () => opts.loaderData(deps),
      }
    );

    React.useEffect(() => {
      setLoaderStatus(
        tab.id,
        query.isLoading || query.isFetching
          ? "loading"
          : query.isError
          ? "error"
          : query.isSuccess
          ? "success"
          : "idle"
      );
    }, [
      query.isLoading,
      query.isFetching,
      query.isError,
      query.isSuccess,
      setLoaderStatus,
      tab.id,
    ]);

    if (query.isLoading) {
      const L =
        opts.loadingComponent ?? FallbackLoading ?? (() => <DefaultLoading />);
      return <L />;
    }
    if (query.isError) {
      const E =
        opts.errorComponent ??
        FallbackError ??
        (({ error }: { error: unknown }) => <DefaultError error={error} />);
      return <E error={JSON.stringify(query.error)} />;
    }

    const FeatureComp = opts.component;

    return (
      <featureContext.Provider
        value={{
          tabsContext: globalContext,
          loaderData: query.data as TLoaderData,
          tabData: tab,
        }}
      >
        <FeatureComp />
      </featureContext.Provider>
    );
  };

  const feature: TabFeature<TSettings, TLoaderDeps, TLoaderData, TContext, K> =
    {
      ...opts,
      featureContext,
      tabsContext,
      useLoaderData,
      useTab,
      useContext,
      useNavigate: (to) => useEnv().navigate(to),
      useAddTab,
      useUpdateTab,
      useDeleteTab,
      View,
      __tag: "TabFeature",
    };

  return feature;
}
