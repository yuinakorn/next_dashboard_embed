"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { focusRing } from "@/components/dashboard-ui";
import type { Category } from "@/lib/portal-types";

function findAncestorChain(categories: Category[], targetId: string, chain: string[] = []): string[] | null {
  for (const category of categories) {
    if (category.id === targetId) {
      return chain;
    }
    const childChain = findAncestorChain(category.children ?? [], targetId, [...chain, category.id]);
    if (childChain) {
      return childChain;
    }
  }
  return null;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
    >
      <path
        d="M5 3l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoryNode({
  category,
  selectedCategory,
  expandedIds,
  onToggle,
  depth,
}: {
  category: Category;
  selectedCategory: string;
  expandedIds: Set<string>;
  onToggle: (id: string, depth: number) => void;
  depth: number;
}) {
  const hasChildren = (category.children?.length ?? 0) > 0;
  const isExpanded = expandedIds.has(category.id);
  const isSelected = selectedCategory === category.id;
  const paddingLeft = 12 + depth * 16;

  return (
    <li>
      <div
        className={`group flex items-center rounded-md ${
          isSelected ? "bg-slate-950" : "hover:bg-slate-100"
        }`}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(category.id, depth)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "ย่อหมวดย่อย" : "ขยายหมวดย่อย"}
            className={`flex h-9 w-7 shrink-0 items-center justify-center rounded-l-md ${
              isSelected ? "text-slate-300 hover:text-white" : "text-slate-500 hover:text-slate-900"
            } ${focusRing}`}
            style={{ marginLeft: paddingLeft - 12 }}
          >
            <ChevronIcon open={isExpanded} />
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="h-9 w-7 shrink-0"
            style={{ marginLeft: paddingLeft - 12 }}
          />
        )}
        <Link
          href={`/catalog?category=${category.id}`}
          className={`flex flex-1 flex-col py-2 pr-3 text-sm ${focusRing} ${
            isSelected ? "font-semibold text-white" : "text-slate-700"
          }`}
          aria-current={isSelected ? "page" : undefined}
        >
          <span className="block truncate">{category.name}</span>
          <span className={`text-xs ${isSelected ? "text-slate-200" : "text-slate-500"}`}>
            {category.dashboardCount.toLocaleString("th-TH")} รายงาน
          </span>
        </Link>
      </div>
      {hasChildren && isExpanded ? (
        <ul className="mt-1 space-y-1">
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              selectedCategory={selectedCategory}
              expandedIds={expandedIds}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function CategoryRail({
  categories,
  selectedCategory,
}: {
  categories: Category[];
  selectedCategory: string;
}) {
  const initialExpanded = useMemo(() => {
    if (selectedCategory === "all") return new Set<string>();
    const chain = findAncestorChain(categories, selectedCategory);
    return new Set<string>(chain ?? []);
  }, [categories, selectedCategory]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(initialExpanded);

  const handleToggle = (id: string, depth: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        // collapse this branch + all descendants
        const collectDescendants = (cats: Category[], targetId: string, found = false): string[] => {
          const acc: string[] = [];
          for (const cat of cats) {
            if (cat.id === targetId || found) {
              acc.push(cat.id);
              for (const child of cat.children ?? []) {
                acc.push(...collectDescendants([child], child.id, true));
              }
            } else if (cat.children?.length) {
              acc.push(...collectDescendants(cat.children, targetId));
            }
          }
          return acc;
        };
        for (const descendantId of collectDescendants(categories, id)) {
          next.delete(descendantId);
        }
      } else {
        // collapse siblings at this depth, then expand this one
        const siblings = (() => {
          if (depth === 0) return categories.map((c) => c.id);
          // find parent's children list
          const parentChain = findAncestorChain(categories, id);
          if (!parentChain || parentChain.length === 0) return categories.map((c) => c.id);
          let pointer: Category[] = categories;
          for (const ancestorId of parentChain) {
            const found = pointer.find((c) => c.id === ancestorId);
            pointer = found?.children ?? [];
          }
          return pointer.map((c) => c.id);
        })();
        for (const siblingId of siblings) {
          next.delete(siblingId);
        }
        next.add(id);
      }
      return next;
    });
  };

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">หมวดรายงาน</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            เลือกหมวดหลักหรือหมวดย่อยเพื่อดูรายงานภายใต้หมวดนั้น
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <Link
          href="/catalog"
          className={`block rounded-md px-3 py-2 text-sm font-semibold ${focusRing} ${
            selectedCategory === "all" ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          ทุกหมวดรายงาน
        </Link>
        <ul className="space-y-1">
          {categories.map((category) => (
            <CategoryNode
              key={category.id}
              category={category}
              selectedCategory={selectedCategory}
              expandedIds={expandedIds}
              onToggle={handleToggle}
              depth={0}
            />
          ))}
        </ul>
      </div>
    </aside>
  );
}
