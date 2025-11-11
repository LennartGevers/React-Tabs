/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {z} from "zod";

// Branding utility
export type Brand<T, B extends string> = T & { readonly __brand?: B };

// Feature keys are branded literal strings
export type FeatureKey<K extends string = string> = Brand<K, "FeatureKey">;

export type LoaderStatus = "idle" | "loading" | "error" | "success";

// Tab instance (generic settings)
export type Tab<TSettings> = {
    id: string;
    featureKey: FeatureKey;
    title: string;
    settings: TSettings; // zod-validated, minimal persisted shape
    dirty?: boolean; // session-only marker
};

// Forward-declared in feature.ts; extractors use this
export type TabFeatureAny = TabFeature<any, any, any, any, string>;

// ---- Type extractors (handy for ergonomics) ----
export type SettingsOf<F> =
    F extends TabFeature<infer S, any, any, any, any> ? S : never;
export type LoaderDepsOf<F> =
    F extends TabFeature<any, infer D, any, any, any> ? D : never;
export type LoaderDataOf<F> =
    F extends TabFeature<any, any, infer L, any, any> ? L : never;
export type CtxOf<F> =
    F extends TabFeature<any, any, any, infer C, any> ? C : never;

export interface TabFeature<
    TSettings,
    TLoaderDeps,
    TLoaderData,
    TContext,
    K extends string = string,
> {
    key: FeatureKey<K>;
    schema: z.ZodType<TSettings, TSettings>;
    component: () => React.ReactNode;
    loadingComponent?: () => React.ReactNode;
    errorComponent?: (p: { error: unknown }) => React.ReactNode;
    loaderDataDeps: (opts: {
        context: TContext;
        tab: Tab<TSettings>;
    }) => TLoaderDeps;
    loaderData: (deps: TLoaderDeps) => Promise<TLoaderData>;
    onClose?: (tab: Tab<TSettings>, ctx: TContext) => Promise<void> | void;
    onPersist?: (tab: Tab<TSettings>, ctx: TContext) => Promise<void> | void;

    // Factory-provided
    featureContext: React.Context<{
        tabsContext: TContext;
        loaderData: TLoaderData;
        tabData: Tab<TSettings>;
    }>;
    tabsContext: React.Context<{
        addTab: (t: Tab<TSettings>) => void;
        updateTab: (
            id: string,
            updater: (t: Tab<TSettings>) => Tab<TSettings>,
        ) => void;
        deleteTab: (id: string) => void;
    }>;

    useLoaderData: () => TLoaderData;
    useTab: () => Tab<TSettings>;
    useContext: () => TContext;
    useNavigate: (to: string | null) => void;
    useAddTab: () => (t: Tab<TSettings>) => void;
    useUpdateTab: () => (
        id: string,
        updater: (t: Tab<TSettings>) => Tab<TSettings>,
    ) => void;
    useDeleteTab: () => (id: string) => void;

    View: (p: {
        FallbackLoading?: React.ComponentType;
        FallbackError?: React.ComponentType<{ error: unknown }>;
    }) => React.ReactElement | null;

    __tag: "TabFeature";
}

export type TabsState = {
    tabs: Record<string, Tab<unknown>>;
    order: string[];
    activeId: string | null;
    loaderById: Record<string, LoaderStatus>;

    addTab: (tab: Tab<unknown>) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateTab: (id: string, updater: (t: Tab<any>) => Tab<any>) => void;
    deleteTab: (id: string) => void;
    setActive: (id: string | null) => void;
    setLoaderStatus: (id: string, s: LoaderStatus) => void;
    clearAll: () => void;
};