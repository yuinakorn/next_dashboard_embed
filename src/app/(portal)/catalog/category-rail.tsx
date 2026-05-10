"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Category } from "@/lib/portal-types";

const palette = {
  paper: "oklch(0.998 0.002 250)",
  muted: "oklch(0.955 0.005 250)",
  border: "oklch(0.91 0.006 250)",
  ink: "oklch(0.21 0.015 255)",
  inkMuted: "oklch(0.5 0.012 255)",
  inkFaint: "oklch(0.66 0.01 255)",
  accent: "oklch(0.5 0.14 258)",
};

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
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
    >
      <path
        d="M5 3l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
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
  const indent = depth * 14;

  return (
    <li>
      <div
        className="group flex items-stretch rounded-md transition-colors duration-150 hover:bg-[oklch(0.96_0.005_250)]"
        style={{
          background: isSelected ? palette.ink : undefined,
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(category.id, depth)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "ย่อหมวดย่อย" : "ขยายหมวดย่อย"}
            className="flex h-9 w-7 shrink-0 items-center justify-center rounded-l-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
            style={{
              marginLeft: indent,
              color: isSelected ? "oklch(0.78 0.01 255)" : palette.inkFaint,
              outlineColor: palette.accent,
            }}
          >
            <ChevronIcon open={isExpanded} />
          </button>
        ) : (
          <span aria-hidden="true" className="h-9 w-7 shrink-0" style={{ marginLeft: indent }} />
        )}
        <Link
          href={`/catalog?category=${category.id}`}
          className="flex flex-1 items-center justify-between gap-2 py-2 pr-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
          style={{
            color: isSelected ? "white" : palette.ink,
            fontWeight: isSelected ? 600 : 500,
            outlineColor: palette.accent,
          }}
          aria-current={isSelected ? "page" : undefined}
        >
          <span className="block truncate">{category.name}</span>
          <span
            className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
            style={{
              background: isSelected ? "oklch(1 0 0 / 0.15)" : palette.muted,
              color: isSelected ? "oklch(0.92 0.005 255)" : palette.inkMuted,
            }}
          >
            {category.dashboardCount.toLocaleString("th-TH")}
          </span>
        </Link>
      </div>
      {hasChildren && isExpanded ? (
        <ul className="mt-0.5 space-y-0.5">
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
        const siblings = (() => {
          if (depth === 0) return categories.map((c) => c.id);
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

  const totalCount = categories.reduce((sum, c) => sum + c.dashboardCount, 0);
  const allSelected = selectedCategory === "all";

  return (
    <aside
      className="rounded-xl border p-3"
      style={{ background: palette.paper, borderColor: palette.border }}
    >
      <div className="px-2 pb-2 pt-1">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: palette.inkMuted }}>
          หมวดรายงาน
        </h2>
      </div>
      <div className="space-y-0.5">
        <Link
          href="/catalog"
          className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-150 hover:bg-[oklch(0.96_0.005_250)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
          style={{
            background: allSelected ? palette.ink : undefined,
            color: allSelected ? "white" : palette.ink,
            fontWeight: allSelected ? 600 : 500,
            outlineColor: palette.accent,
          }}
          aria-current={allSelected ? "page" : undefined}
        >
          <span>ทุกหมวดรายงาน</span>
          <span
            className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
            style={{
              background: allSelected ? "oklch(1 0 0 / 0.15)" : palette.muted,
              color: allSelected ? "oklch(0.92 0.005 255)" : palette.inkMuted,
            }}
          >
            {totalCount.toLocaleString("th-TH")}
          </span>
        </Link>
        <ul className="space-y-0.5">
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
