import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from 'react';
import { TabFeature } from './TabFeature';
import type {
  AnyTabFeatureElement,
  TabFeatureElement,
  TabRenderContext,
  TabUnion,
  TabsProps,
} from './types';

function isTabFeatureElement<Type extends string, State>(
  child: unknown,
): child is TabFeatureElement<Type, State> {
  return isValidElement(child) && child.type === TabFeature;
}

const warn = (message: string) => {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(message);
  }
};

function useFeatureRegistry(children: TabsProps<readonly AnyTabFeatureElement[]>['children']) {
  return useMemo(() => {
    const registry = new Map<string, AnyTabFeatureElement>();
    Children.forEach(children as unknown as ReactNode, (child) => {
      if (isTabFeatureElement(child)) {
        if (registry.has(child.props.type)) {
          warn(`Duplicate TabFeature with type "${child.props.type}" was ignored.`);
          return;
        }
        registry.set(child.props.type, child as AnyTabFeatureElement);
      }
    });
    return registry;
  }, [children]);
}

export function Tabs<Features extends readonly AnyTabFeatureElement[]>(
  props: TabsProps<Features>,
): JSX.Element | null {
  const {
    tabs,
    children,
    activeTabId: controlledActiveId,
    defaultActiveTabId,
    onTabChange,
    onTabClose,
    renderEmpty,
  } = props;

  const features = useFeatureRegistry(children);

  const [uncontrolledActiveId, setUncontrolledActiveId] = useState<string | undefined>(() => {
    if (controlledActiveId !== undefined) {
      return controlledActiveId;
    }
    if (defaultActiveTabId !== undefined) {
      return defaultActiveTabId;
    }
    return tabs[0]?.id;
  });

  useEffect(() => {
    if (controlledActiveId !== undefined) {
      setUncontrolledActiveId((prev) => (prev === controlledActiveId ? prev : controlledActiveId));
    }
  }, [controlledActiveId]);

  useEffect(() => {
    if (controlledActiveId !== undefined) {
      return;
    }
    setUncontrolledActiveId((current) => {
      if (current && tabs.some((tab) => tab.id === current)) {
        return current;
      }
      return tabs[0]?.id ?? current;
    });
  }, [controlledActiveId, tabs]);

  const activeTabId = controlledActiveId ?? uncontrolledActiveId;

  const handleActivate = useCallback(
    (tab: TabUnion<Features>) => {
      if (controlledActiveId === undefined) {
        setUncontrolledActiveId(tab.id);
      }
      onTabChange?.(tab);
    },
    [controlledActiveId, onTabChange],
  );

  const handleClose = useCallback(
    (tab: TabUnion<Features>) => {
      onTabClose?.(tab);
      if (controlledActiveId === undefined && tab.id === uncontrolledActiveId) {
        const next = tabs.find((candidate) => candidate.id !== tab.id);
        setUncontrolledActiveId(next?.id);
      }
    },
    [controlledActiveId, onTabClose, tabs, uncontrolledActiveId],
  );

  if (tabs.length === 0) {
    if (renderEmpty) {
      return <>{renderEmpty()}</>;
    }
    return null;
  }

  const renderedTabs = tabs.map((tab) => {
    const feature = features.get(tab.type);
    if (!feature) {
      warn(`No TabFeature found for tab type "${tab.type}".`);
      return null;
    }

    const typedTab = tab as TabUnion<Features>;
    const context: TabRenderContext<TabUnion<Features>> = {
      tab: typedTab,
      isActive: tab.id === activeTabId,
      activate: () => handleActivate(typedTab),
      close: onTabClose ? () => handleClose(typedTab) : undefined,
    };

    return feature.props.render(context);
  });

  return <>{renderedTabs}</>;
}

export type { TabsProps } from './types';
