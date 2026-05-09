"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge, TableShell, buttonStyles, fieldStyles } from "@/components/dashboard-ui";
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

const statusLabels: Record<CategoryStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
};

const statusTone: Record<CategoryStatus, string> = {
  active: "bg-emerald-50 text-emerald-800",
  inactive: "bg-amber-50 text-amber-900",
  archived: "bg-slate-200 text-slate-700",
};

function buildDepthMap(categories: ManagedCategory[]) {
  const byParent = new Map<string | null, ManagedCategory[]>();

  for (const category of categories) {
    const siblings = byParent.get(category.parentId) ?? [];
    siblings.push(category);
    byParent.set(category.parentId, siblings);
  }

  for (const siblings of byParent.values()) {
    siblings.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  const depth = new Map<string, number>();
  const visit = (parentId: string | null, level: number) => {
    for (const category of byParent.get(parentId) ?? []) {
      depth.set(category.id, level);
      visit(category.id, level + 1);
    }
  };

  visit(null, 0);
  return depth;
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
  const [selectedId, setSelectedId] = useState(initialCategories[0]?.id ?? "");
  const selectedCategory = categories.find((category) => category.id === selectedId) ?? categories[0];
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
  const depthMap = useMemo(() => buildDepthMap(categories), [categories]);
  const activeParentOptions = categories.filter((category) => category.status === "active");
  const defaultParentId = canCreateRoot ? "" : activeParentOptions[0]?.id ?? "";

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
        setMessage(body?.error ?? "ไม่สามารถบันทึกหมวดหมู่ได้");
        return;
      }

      setCategories(body.categories);
      setMessage("บันทึกหมวดหมู่แล้ว");
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
        setMessage(body?.error ?? "ไม่สามารถสร้างหมวดหมู่ได้");
        return;
      }

      setCategories(body.categories);
      setSelectedId(body.id ?? selectedId);
      setCreateDraft(defaultDraft(teams, defaultParentId));
      setMessage("สร้างหมวดหมู่แล้ว");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <TableShell
        title="Category tree"
        description="หมวดหมู่ทั้งหมดพร้อมสถานะ owner และจำนวน dashboard ที่อ้างอิงอยู่"
      >
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Owner team</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Sort</th>
              <th className="px-4 py-3 font-semibold">Dashboards</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {categories.map((category) => {
              const active = category.id === selectedCategory?.id;

              return (
                <tr key={category.id} className={active ? "bg-sky-50/50" : "bg-slate-50"}>
                  <td className="px-4 py-4 align-top">
                    <div style={{ paddingLeft: (depthMap.get(category.id) ?? 0) * 18 }}>
                      <p className="font-semibold text-slate-950">{category.name}</p>
                      <p className="mt-1 font-mono text-xs text-slate-400">{category.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-600">
                    {teamNames.get(category.ownerTeamId) ?? category.ownerTeamId}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Badge className={statusTone[category.status]}>
                      {statusLabels[category.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-600">{category.sortOrder}</td>
                  <td className="px-4 py-4 align-top text-slate-600">{category.dashboardCount}</td>
                  <td className="px-4 py-4 align-top">
                    <button
                      type="button"
                      className={`${buttonStyles.secondary} h-9`}
                      onClick={() => selectCategory(category)}
                    >
                      แก้ไข
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableShell>

      <aside className="space-y-4">
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Edit category
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            {selectedCategory?.name ?? "No category"}
          </h2>

          {selectedCategory ? (
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                Name
                <input
                  className={`${fieldStyles} mt-1 h-10 w-full`}
                  value={editDraft.name}
                  onChange={(event) =>
                    setEditDraft((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Owner team
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
                  Status
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Sort
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

        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Create category
          </p>
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              Name
              <input
                className={`${fieldStyles} mt-1 h-10 w-full`}
                value={createDraft.name}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="เช่น Data Quality"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Parent
              <select
                className={`${fieldStyles} mt-1 h-10 w-full`}
                value={createDraft.parentId}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, parentId: event.target.value }))
                }
              >
                {canCreateRoot ? <option value="">Root category</option> : null}
                {activeParentOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {"-".repeat(depthMap.get(category.id) ?? 0)} {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Owner team
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
              Sort
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
              {isPending ? "กำลังสร้าง" : "สร้างหมวดหมู่"}
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
