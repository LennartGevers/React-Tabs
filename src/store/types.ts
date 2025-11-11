import { Tab } from "../types";

export interface TabStore<TSettings> {
    select: <TSelect>(
        selector: (state: Tab<TSettings>[]) => TSelect,
    ) => TSelect;
    addTab: (tab: Tab<TSettings>) => void;
    updateTab: (tab: Tab<TSettings>) => void;
    deleteTab: (id: string) => void;
}
