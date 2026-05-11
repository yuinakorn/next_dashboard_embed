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
  archived: "bg-[oklch(0.91_0.006_250)] text-[oklch(0.3_0.018_255)]",
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
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
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

  function toggleCreateDrawer(parentId = selectedCategory?.id ?? defaultParentId) {
    setCreateDraft((current) => ({ ...current, parentId }));
    setIsCreateDrawerOpen((current) => !current);
    setMessage(null);
  }

  function closeCreateDrawer() {
    setIsCreateDrawerOpen(false);
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
        setMessage({ text: body?.error ?? "ไม่สามารถบันทึกหมวดรายงานได้", type: "error" });
        return;
      }

      setCategories(body.categories);
      setMessage({ text: "บันทึกหมวดรายงานแล้ว", type: "success" });
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
        setMessage({ text: body?.error ?? "ไม่สามารถสร้างหมวดรายงานได้", type: "error" });
        return;
      }

      setCategories(body.categories);
      setSelectedId(body.id ?? selectedId);
      setCreateDraft(defaultDraft(teams, defaultParentId));
      setMessage({ text: "สร้างหมวดรายงานแล้ว", type: "success" });
      setIsCreateDrawerOpen(false);
    });
  }

  function reorderSiblings(targetNode: CategoryNode) {
    if (!draggedId || draggedId === targetNode.id) {
      return;
    }

    const dragged = categories.find((category) => category.id === draggedId);

    if (!dragged) {
      return;
    }

    if (dragged.parentId !== targetNode.parentId) {
      setMessage({ text: "ย้ายลำดับได้เฉพาะภายในหมวดแม่เดียวกัน", type: "error" });
      return;
    }

    const siblings = categories
      .filter((category) => category.parentId === dragged.parentId)
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "th-TH"),
      );
    const fromIdx = siblings.findIndex((category) => category.id === dragged.id);
    const toIdx = siblings.findIndex((category) => category.id === targetNode.id);

    if (fromIdx === -1 || toIdx === -1) {
      return;
    }

    const reordered = [...siblings];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const updated = reordered.map((category, index) => ({
      ...category,
      sortOrder: index,
    }));
    const changed = updated.filter((category) => {
      const original = siblings.find((sibling) => sibling.id === category.id);
      return original && original.sortOrder !== category.sortOrder;
    });

    if (changed.length === 0) {
      return;
    }

    setCategories((current) =>
      current.map((category) => {
        const next = updated.find((entry) => entry.id === category.id);
        return next ? { ...category, sortOrder: next.sortOrder } : category;
      }),
    );
    setMessage(null);
    startTransition(async () => {
      try {
        const responses = await Promise.all(
          changed.map((category) =>
            fetch(`/api/admin/categories/${category.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: category.name,
                ownerTeamId: category.ownerTeamId,
                status: category.status,
                sortOrder: category.sortOrder,
              }),
            }),
          ),
        );
        const lastOk = [...responses].reverse().find((response) => response.ok);

        if (!lastOk) {
          setMessage({ text: "ไม่สามารถย้ายลำดับหมวดได้", type: "error" });
          return;
        }

        const body = (await lastOk.json().catch(() => null)) as {
          categories?: ManagedCategory[];
        } | null;

        if (body?.categories) {
          setCategories(body.categories);
        }

        setMessage({ text: "ย้ายลำดับหมวดเรียบร้อย", type: "success" });
      } catch {
        setMessage({ text: "ไม่สามารถย้ายลำดับหมวดได้", type: "error" });
      }
    });
  }

  function renderNode(node: CategoryNode) {
    const selected = node.id === selectedCategory?.id;
    const hasChildren = node.children.length > 0;
    const draggedNode = draggedId
      ? categories.find((category) => category.id === draggedId) ?? null
      : null;
    const isDropTarget =
      dragOverId === node.id &&
      draggedNode !== null &&
      draggedNode.id !== node.id &&
      draggedNode.parentId === node.parentId;
    const isDragging = draggedId === node.id;
    const row = (
      <button
        type="button"
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", node.id);
          setDraggedId(node.id);
        }}
        onDragEnd={() => {
          setDraggedId(null);
          setDragOverId(null);
        }}
        onDragOver={(event) => {
          if (
            !draggedId ||
            draggedId === node.id ||
            !draggedNode ||
            draggedNode.parentId !== node.parentId
          ) {
            return;
          }

          event.preventDefault();
          event.dataTransfer.dropEffect = "move";

          if (dragOverId !== node.id) {
            setDragOverId(node.id);
          }
        }}
        onDragLeave={() => {
          setDragOverId((current) => (current === node.id ? null : current));
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          reorderSiblings(node);
          setDraggedId(null);
          setDragOverId(null);
        }}
        className={`w-full rounded-md px-3 py-2 text-left transition ${
          selected ? "bg-[oklch(0.21_0.015_255)] text-white" : "hover:bg-[oklch(0.955_0.005_250)]"
        } ${isDropTarget ? "ring-2 ring-[oklch(0.5_0.14_258)] ring-offset-1" : ""} ${
          isDragging ? "opacity-50" : ""
        }`}
        onClick={() => selectCategory(node)}
      >
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{node.name}</span>
            <span className={`mt-0.5 block truncate text-xs ${selected ? "text-[oklch(0.91_0.006_250)]" : "text-[oklch(0.5_0.012_255)]"}`}>
              {teamNames.get(node.ownerTeamId) ?? node.ownerTeamId}
            </span>
          </span>
          <span className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${selected ? "bg-white/15 text-white" : "bg-[oklch(0.955_0.005_250)] text-[oklch(0.5_0.012_255)]"}`}>
            {node.dashboardCount.toLocaleString("th-TH")}
          </span>
        </span>
      </button>
    );

    if (!hasChildren) {
      return (
        <li key={node.id} className="flex gap-1" style={{ paddingLeft: `${node.depth * 10}px` }}>
          <span className="mt-5 h-px w-3 shrink-0 bg-[oklch(0.91_0.006_250)]" aria-hidden="true" />
          <div className="min-w-0 flex-1">{row}</div>
        </li>
      );
    }

    return (
      <li key={node.id} style={{ paddingLeft: `${node.depth * 10}px` }}>
        <details open={node.depth === 0 || (selectedCategory ? containsNode(node, selectedCategory.id) : false)}>
          <summary className="list-none [&::-webkit-details-marker]:hidden">{row}</summary>
          <ul className="mt-1 space-y-1 border-l border-[oklch(0.91_0.006_250)] pl-2">
            {node.children.map((child) => renderNode(child))}
          </ul>
        </details>
      </li>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-lg border border-[oklch(0.91_0.006_250)] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[oklch(0.91_0.006_250)] pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[oklch(0.21_0.015_255)]">โครงสร้างหมวดรายงาน</h2>
            <p className="mt-1 text-sm text-[oklch(0.5_0.012_255)]">คลี่หมวดเพื่อเลือก แก้ไข หรือสร้างหมวดย่อย · ลากหมวดเพื่อย้ายลำดับภายในหมวดแม่เดียวกัน</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md bg-[oklch(0.955_0.005_250)] px-3 py-2">
                <p className="text-xs text-[oklch(0.5_0.012_255)]">หมวดทั้งหมด</p>
                <p className="font-semibold text-[oklch(0.21_0.015_255)]">{categories.length.toLocaleString("th-TH")}</p>
              </div>
              <div className="rounded-md bg-[oklch(0.955_0.005_250)] px-3 py-2">
                <p className="text-xs text-[oklch(0.5_0.012_255)]">รายงานในหมวดหลัก</p>
                <p className="font-semibold text-[oklch(0.21_0.015_255)]">{totalReports.toLocaleString("th-TH")}</p>
              </div>
            </div>
            <button
              type="button"
              className={`${buttonStyles.primary} h-10 justify-center whitespace-nowrap`}
              aria-expanded={isCreateDrawerOpen}
              onClick={() => toggleCreateDrawer()}
            >
              {isCreateDrawerOpen ? "ปิดการเพิ่ม" : "เพิ่มหมวดรายงาน"}
            </button>
          </div>
        </div>
        <ul className="mt-4 space-y-1">{tree.map((node) => renderNode(node))}</ul>
      </section>

      <aside className="space-y-4">
        <section className="rounded-lg border border-[oklch(0.91_0.006_250)] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[oklch(0.66_0.01_255)]">
            แก้ไขหมวดรายงาน
          </p>
          <h2 className="mt-2 text-lg font-semibold text-[oklch(0.21_0.015_255)]">
            {selectedCategory?.name ?? "ยังไม่ได้เลือกหมวด"}
          </h2>

          {selectedCategory ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge className={statusTone[selectedCategory.status]}>
                  {statusLabels[selectedCategory.status]}
                </Badge>
                <span className="rounded-md bg-[oklch(0.955_0.005_250)] px-2 py-1 text-xs font-semibold text-[oklch(0.5_0.012_255)]">
                  ระดับ {selectedNode?.depth ?? 0}
                </span>
              </div>
              <label className="block text-sm font-semibold text-[oklch(0.3_0.018_255)]">
                ชื่อหมวด
                <input
                  className={`${fieldStyles} mt-1 h-10 w-full`}
                  value={editDraft.name}
                  onChange={(event) =>
                    setEditDraft((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
              <label className="block text-sm font-semibold text-[oklch(0.3_0.018_255)]">
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
                <label className="block text-sm font-semibold text-[oklch(0.3_0.018_255)]">
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
                <label className="block text-sm font-semibold text-[oklch(0.3_0.018_255)]">
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

        {message ? (
          <div
            className="rounded-md border px-3 py-2 text-sm font-medium"
            style={
              message.type === "success"
                ? { borderColor: "oklch(0.8 0.07 165)", background: "oklch(0.96 0.025 165)", color: "oklch(0.4 0.1 165)" }
                : { borderColor: "oklch(0.85 0.06 25)", background: "oklch(0.96 0.03 25)", color: "oklch(0.42 0.13 25)" }
            }
          >
            {message.text}
          </div>
        ) : null}
      </aside>

      {isCreateDrawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-[oklch(0.21_0.015_255)]/25">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="ปิดแผงเพิ่มหมวดรายงาน"
            onClick={closeCreateDrawer}
          />
          <aside className="relative flex h-full w-full max-w-xl flex-col border-l border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] shadow-2xl">
            <div className="border-b border-[oklch(0.91_0.006_250)] bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[oklch(0.66_0.01_255)]">
                    เพิ่มหมวดรายงาน
                  </p>
                  <h2 className="mt-2 truncate text-xl font-semibold text-[oklch(0.21_0.015_255)]">
                    สร้างหมวดรายงานใหม่
                  </h2>
                  <p className="mt-1 text-sm text-[oklch(0.5_0.012_255)]">
                    เลือกหมวดแม่และหน่วยงานเจ้าของก่อนบันทึก
                  </p>
                </div>
                <button
                  type="button"
                  className={`${buttonStyles.secondary} h-9 px-3`}
                  onClick={closeCreateDrawer}
                >
                  ปิด
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-[oklch(0.3_0.018_255)]">
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
                <label className="block text-sm font-semibold text-[oklch(0.3_0.018_255)]">
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
                <label className="block text-sm font-semibold text-[oklch(0.3_0.018_255)]">
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
                <label className="block text-sm font-semibold text-[oklch(0.3_0.018_255)]">
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
              </div>
            </div>

            <div className="border-t border-[oklch(0.91_0.006_250)] bg-white px-5 py-4">
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <button
                  type="button"
                  className={`${buttonStyles.primary} h-10 justify-center`}
                  disabled={isPending}
                  onClick={createCategory}
                >
                  {isPending ? "กำลังสร้าง" : "สร้างหมวดรายงาน"}
                </button>
                <button
                  type="button"
                  className={`${buttonStyles.secondary} h-10 justify-center`}
                  disabled={isPending}
                  onClick={closeCreateDrawer}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
