"use client";

import { useCallback, useMemo, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { AppLanguage } from "@/lib/settings/preferences-storage";
import {
  mergeNavOrder,
  readNavOrder,
  sortNavItemsByOrder,
  writeNavOrder,
} from "@/lib/layout/nav-order-storage";
import { getPrimaryNavItems, type NavItem } from "@/lib/layout/navigation";

export function useNavOrder(language: AppLanguage) {
  const defaultItems = useMemo(() => getPrimaryNavItems(language), [language]);
  const defaultHrefs = useMemo(
    () => defaultItems.map((item) => item.href),
    [defaultItems]
  );

  const [order, setOrder] = useState<string[]>(() =>
    mergeNavOrder(readNavOrder(), defaultHrefs)
  );

  const items = useMemo(() => {
    const mergedOrder = mergeNavOrder(order, defaultHrefs);
    return sortNavItemsByOrder(getPrimaryNavItems(language), mergedOrder);
  }, [language, order, defaultHrefs]);

  const reorderItems = useCallback((activeId: string, overId: string) => {
    setOrder((previousOrder) => {
      const oldIndex = previousOrder.indexOf(activeId);
      const newIndex = previousOrder.indexOf(overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return previousOrder;
      }

      const nextOrder = arrayMove(previousOrder, oldIndex, newIndex);
      writeNavOrder(nextOrder);
      return nextOrder;
    });
  }, []);

  return { items, reorderItems };
}

export type { NavItem };
