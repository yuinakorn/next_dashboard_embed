"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge, buttonStyles, fieldStyles } from "@/components/dashboard-ui";
import type { ManagedCategory } from "@/lib/db/categories";
import type { PortalTeam } from "@/lib/db/users";
import type { CategoryStatus } from "@/lib/portal-types";

type CategoryManagerProps = {
  initialCategories: ManagedCategory[];
  teams: PortalTeam[];
  canCreateRoot: boolean;
};

type CategoryDraft = {
  name: string;
  parentId: string;
  ownerTeamId: string;
  sortOrder: string;
};

type CategoryNode = ManagedCategory & {
  children: CategoryNode[];
  depth: number;
};

const statusLabels: Record<CategoryStatus, string> = {
  active: "ใช้งาน",
  inactive: "ปิดใช้งาน",
  archived: "เก็บถาวร",
};

const statusTone: Record<CategoryStatus, string> = {
  active: "bg-emerald-50 text-emerald-800",
  inactive: "bg-amber-50 text-amber-900",
  archived: "bg-slate-200 text-slate-700",
};

function buildCategoryTree(categories: ManagedCategory[], parentId: string | null = null, depth = 0): CategoryNode[] {
  return categories
    .filter((category) => category.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "th-TH"))
    .map((category) => ({
      ...category,
      depth,
      children: buildCategoryTree(categories, category.id, depth + 1),
    }));
}

function findNode(nodes: CategoryNode[], id: string): CategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    const child = findNode(node.children, id);

    if (child) {
      return child;
    }
  }

  return null;
}

function containsNode(node: CategoryNode, id: string): boolean {
  return node.id === id || node.children.some((child) => containsNode(child, id));
}

function defaultDraft(teams: PortalTeam[], parentId = ""): CategoryDraft {
  return {
    name: "",
    parentId,
    ownerTeamId: teams[0]?.id ?? "",
    sortOrder: "0",
  };
}

export function CategoryManager({
  initialCategories,
  teams,
  canCreateRoot,
}: CategoryManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const [selectedId, setSelectedId] = useState(initialCategories.find((category) => category.status === "active")?.id ?? initialCategories[0]?.id ?? "");
  const selectedCategory = categories.find((category) => category.id === selectedId) ?? categories[0];
  const selectedNode = selectedCategory ? findNode(tree, selectedCategory.id) : null;
  const [editDraft, setEditDraft] = useState(() => ({
    name: selectedCategory?.name ?? "",
    ownerTeamId: selectedCategory?.ownerTeamId ?? teams[0]?.id ?? "",
    status: selectedCategory?.status ?? "active",
    sortOrder: String(selectedCategory?.sortOrder ?? 0),
  }));
  const [createDraft, setCreateDraft] = useState<CategoryDraft>(() =>
    defaultDraft(
      teams,
      canCreateRoot
        ? ""
        : initialCategories.find((category) => category.status === "active")?.id ?? "",
    ),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const teamNames = useMemo(
    () => new Map(teams.map((team) => [team.id, team.name])),
    [teams],
  );
  const activeParentOptions = categories.filter((category) => category.status === "active");
  const defaultParentId = canCreateRoot ? "" : activeParentOptions[0]?.id ?? "";
  const totalReports = categories
    .filter((category) => category.parentId === null && category.status === "active")
    .reduce((sum, category) => sum + category.dashboardCount, 0);

  function selectCategory(category: ManagedCategory) {
    setSelectedId(category.id);
    setEditDraft({
      name: category.name,
      ownerTeamId: category.ownerTeamId,
      status: category.status,
      sortOrder: String(category.sortOrder),
    });
    setCreateDraft((current) => ({ ...current, parentId: category.id }));
    setMessage(null);
  }

  function updateSelectedCategory() {
    if (!selectedCategory) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/admin/categories/${selectedCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        categories?: ManagedCategory[];
      } | null;

      if (!response.ok || !body?.categories) {
        setMessage(body?.error ?? "ไม่สามารถบันทึกหมวดรายงานได้");
        return;
      }

      setCategories(body.categories);
      setMessage("บันทึกหมวดรายงานแล้ว");
    });
  }

  function createCategory() {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createDraft),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        id?: string;
        categories?: ManagedCategory[];
      } | null;

      if (!response.ok || !body?.categories) {
        setMessage(body?.error ?? "ไม่สามารถสร้างหมวดรายงานได้");
        return;
      }

      setCategories(body.categories);
      setSelectedId(body.id ?? selectedId);
      setCreateDraft(defaultDraft(teams, defaultParentId));
      setMessage("สร้างหมวดรายงานแล้ว");
    });
  }

  function renderNode(node: CategoryNode) {
    const selected = node.id === selectedCategory?.id;
    const hasChildren = node.children.length > 0;
    const row = (
      <button
        type="button"
        className={`w-full rounded-md px-3 py-2 text-left transition ${
          selected ? "bg-slate-950 text-white" : "hover:bg-slate-100"
        }`}
        onClick={() => selectCategory(node)}
      >
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{node.name}</span>
            <span className={`mt-0.5 block truncate text-xs ${selected ? "text-slate-200" : "text-slate-500"}`}>
              {teamNames.get(node.ownerTeamId) ?? node.ownerTeamId}
            </span>
          </span>
          <span className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${selected ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"}`}>
            {node.dashboardCount.toLocaleString("th-TH")}
          </span>
        </span>
      </button>
    );

    if (!hasChildren) {
      return (
        <li key={node.id} className="flex gap-1" style={{ paddingLeft: `${node.depth * 10}px` }}>
          <span className="mt-5 h-px w-3 shrink-0 bg-slate-200" aria-hidden="true" />
          <div className="min-w-0 flex-1">{row}</div>
        </li>
      );
    }

    return (
      <li key={node.id} style={{ paddingLeft: `${node.depth * 10}px` }}>
        <details open={node.depth === 0 || (selectedCategory ? containsNode(node, selectedCategory.id) : false)}>
          <summary className="list-none [&::-webkit-details-marker]:hidden">{row}</summary>
          <ul className="mt-1 space-y-1 border-l border-slate-200 pl-2">
            {node.children.map((child) => renderNode(child))}
          </ul>
        </details>
      </li>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">โครงสร้างหมวดรายงาน</h2>
            <p className="mt-1 text-sm text-slate-500">คลี่หมวดเพื่อเลือก แก้ไข หรือสร้างหมวดย่อย</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md bg-slate-100 px-3 py-2">
              <p className="text-xs text-slate-500">หมวดทั้งหมด</p>
              <p className="font-semibold text-slate-950">{categories.length.toLocaleString("th-TH")}</p>
            </div>
            <div className="rounded-md bg-slate-100 px-3 py-2">
              <p className="text-xs text-slate-500">รายงานในหมวดหลัก</p>
              <p className="font-semibold text-slate-950">{totalReports.toLocaleString("th-TH")}</p>
            </div>
          </div>
        </div>
        <ul className="mt-4 space-y-1">{tree.map((node) => renderNode(node))}</ul>
      </section>

      <aside className="space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            แก้ไขหมวดรายงาน
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            {selectedCategory?.name ?? "ยังไม่ได้เลือกหมวด"}
          </h2>

          {selectedCategory ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge className={statusTone[selectedCategory.status]}>
                  {statusLabels[selectedCategory.status]}
                </Badge>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  ระดับ {selectedNode?.depth ?? 0}
                </span>
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                ชื่อหมวด
                <input
                  className={`${fieldStyles} mt-1 h-10 w-full`}
                  value={editDraft.name}
                  onChange={(event) =>
                    setEditDraft((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                หน่วยงานเจ้าของ
                <select
                  className={`${fieldStyles} mt-1 h-10 w-full`}
                  value={editDraft.ownerTeamId}
                  onChange={(event) =>
                    setEditDraft((current) => ({ ...current, ownerTeamId: event.target.value }))
                  }
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold text-slate-700">
                  สถานะ
                  <select
                    className={`${fieldStyles} mt-1 h-10 w-full`}
                    value={editDraft.status}
                    onChange={(event) =>
                      setEditDraft((current) => ({
                        ...current,
                        status: event.target.value as CategoryStatus,
                      }))
                    }
                  >
                    <option value="active">ใช้งาน</option>
                    <option value="inactive">ปิดใช้งาน</option>
                    <option value="archived">เก็บถาวร</option>
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  ลำดับ
                  <input
                    className={`${fieldStyles} mt-1 h-10 w-full`}
                    type="number"
                    value={editDraft.sortOrder}
                    onChange={(event) =>
                      setEditDraft((current) => ({ ...current, sortOrder: event.target.value }))
                    }
                  />
                </label>
              </div>
              <button
                type="button"
                className={`${buttonStyles.primary} h-10 w-full justify-center`}
                disabled={isPending}
                onClick={updateSelectedCategory}
              >
                {isPending ? "กำลังบันทึก" : "บันทึกการแก้ไข"}
              </button>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            สร้างหมวดรายงาน
          </p>
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              ชื่อหมวด
              <input
                className={`${fieldStyles} mt-1 h-10 w-full`}
                value={createDraft.name}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="เช่น คุณภาพข้อมูล"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              หมวดแม่
              <select
                className={`${fieldStyles} mt-1 h-10 w-full`}
                value={createDraft.parentId}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, parentId: event.target.value }))
                }
              >
                {canCreateRoot ? <option value="">หมวดหลัก</option> : null}
                {activeParentOptions.map((category) => {
                  const node = findNode(tree, category.id);
                  return (
                    <option key={category.id} value={category.id}>
                      {"- ".repeat(node?.depth ?? 0)}
                      {category.name}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              หน่วยงานเจ้าของ
              <select
                className={`${fieldStyles} mt-1 h-10 w-full`}
                value={createDraft.ownerTeamId}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, ownerTeamId: event.target.value }))
                }
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              ลำดับ
              <input
                className={`${fieldStyles} mt-1 h-10 w-full`}
                type="number"
                value={createDraft.sortOrder}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, sortOrder: event.target.value }))
                }
              />
            </label>
            <button
              type="button"
              className={`${buttonStyles.secondary} h-10 w-full justify-center`}
              disabled={isPending}
              onClick={createCategory}
            >
              {isPending ? "กำลังสร้าง" : "สร้างหมวดรายงาน"}
            </button>
          </div>
        </section>

        {message ? (
          <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
            {message}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
