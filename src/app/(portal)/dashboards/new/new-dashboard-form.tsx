"use client";

import { useMemo, useState, useEffect } from "react";
import { buttonStyles, fieldStyles } from "@/components/dashboard-ui";
import type { CategoryOption } from "@/lib/category-utils";
import { assessEmbedUrl, getEmbedStatusTone } from "@/lib/embed-policy";
import type { EmbedHealthResult } from "@/lib/embed-policy";
import type {
  Dashboard,
  DashboardProvider,
  DashboardStatus,
  RefreshFrequency,
  SensitivityLevel,
} from "@/lib/portal-types";

type SubmitIntent = "draft" | "review" | "save";

type FormState = {
  title: string;
  provider: DashboardProvider;
  description: string;
  categoryId: string;
  status: DashboardStatus;
  sensitivity: SensitivityLevel;
  embedUrl: string;
  externalUrl: string;
  tags: string;
  refreshFrequency: RefreshFrequency;
  dataSourceNote: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type CreatedDashboardResult = {
  id: string;
  title: string;
  status: string;
};

type CategoryOptionNode = CategoryOption & {
  children: CategoryOptionNode[];
};

const providerOptions: DashboardProvider[] = ["BI", "Custom"];

const sensitivityOptions: SensitivityLevel[] = ["public", "internal", "confidential", "restricted"];

const refreshFrequencyOptions: RefreshFrequency[] = ["unknown", "daily", "weekly", "monthly", "manual"];

function isHttpsUrl(value: string): boolean {
  if (!value.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function getProviderHint(provider: DashboardProvider): string {
  if (provider === "BI") {
    return "BI Platform ภายในองค์กร ใช้ embed URL จากระบบ BI ที่ใช้งานอยู่";
  }

  return "ถ้า Provider บล็อก iframe ผู้ใช้ยังเปิดผ่าน external fallback ได้";
}

function validateForm(state: FormState, intent: SubmitIntent): FormErrors {
  const errors: FormErrors = {};

  if (!state.title.trim()) {
    errors.title = "กรุณาระบุชื่อรายงาน";
  }

  if (state.description.trim().length < 20) {
    errors.description = "คำอธิบายควรบอกวัตถุประสงค์ของรายงาน";
  }

  if (!state.categoryId) {
    errors.categoryId = "กรุณาเลือกหมวดหมู่ที่คุณมีสิทธิ์";
  }

  if (!isHttpsUrl(state.embedUrl)) {
    errors.embedUrl = "Embed URL ต้องเป็น HTTPS URL ที่ถูกต้อง";
  }

  if (state.externalUrl.trim() && !isHttpsUrl(state.externalUrl)) {
    errors.externalUrl = "Fallback URL ต้องเป็น HTTPS URL ที่ถูกต้อง";
  }

  if (state.sensitivity === "public" && intent === "review" && !state.dataSourceNote.trim()) {
    errors.dataSourceNote = "รายงานสาธารณะต้องระบุที่มา/ข้อจำกัดของข้อมูลก่อนส่งตรวจ";
  }

  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm font-medium text-rose-700">{message}</p>;
}

type ToastProps = {
  message: string;
  type: "success" | "error";
  link?: { href: string; label: string };
  onDismiss: () => void;
};

function Toast({ message, type, link, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border shadow-lg px-4 py-3 animate-in slide-in-from-bottom-4 fade-in duration-200
      ${type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}"
      style={type === "success"
        ? { borderColor: "#a7f3d0", backgroundColor: "#f0fdf4", color: "#14532d" }
        : { borderColor: "#fecaca", backgroundColor: "#fff1f2", color: "#7f1d1d" }
      }
      role="status"
      aria-live="polite"
    >
      <span className="mt-0.5 shrink-0 text-lg leading-none">
        {type === "success" ? "✓" : "✕"}
      </span>
      <div className="flex-1 text-sm font-medium leading-5">
        {message}
        {link ? (
          <a href={link.href} className="ml-2 underline underline-offset-2 opacity-80 hover:opacity-100">
            {link.label}
          </a>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="ปิด"
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}

function buildCategoryOptionTree(options: CategoryOption[]): CategoryOptionNode[] {
  const roots: CategoryOptionNode[] = [];
  const stack: CategoryOptionNode[] = [];

  for (const option of options) {
    const node: CategoryOptionNode = { ...option, children: [] };

    while (stack.length && stack[stack.length - 1].depth >= option.depth) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }

    stack.push(node);
  }

  return roots;
}

function CategoryTreePicker({
  options,
  value,
  onChange,
}: {
  options: CategoryOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const tree = useMemo(() => buildCategoryOptionTree(options), [options]);

  function renderNode(node: CategoryOptionNode) {
    const selected = node.id === value;
    const content = (
      <button
        type="button"
        className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
          selected
            ? "bg-[oklch(0.21_0.015_255)] font-semibold text-white"
            : "bg-white text-[oklch(0.3_0.018_255)] hover:bg-[oklch(0.955_0.005_250)] hover:text-[oklch(0.21_0.015_255)]"
        }`}
        onClick={() => onChange(node.id)}
      >
        <span className="block">{node.name}</span>
      </button>
    );

    if (!node.children.length) {
      return (
        <li key={node.id} className="flex gap-1">
          <span className="mt-5 h-px w-3 shrink-0 bg-[oklch(0.91_0.006_250)]" aria-hidden="true" />
          {content}
        </li>
      );
    }

    return (
      <li key={node.id}>
        <details open={node.depth === 0 || node.children.some((child) => containsCategoryOption(child, value))}>
          <summary className="list-none [&::-webkit-details-marker]:hidden">{content}</summary>
          <ul className="ml-4 mt-1 space-y-1 border-l border-[oklch(0.91_0.006_250)] pl-2">
            {node.children.map((child) => renderNode(child))}
          </ul>
        </details>
      </li>
    );
  }

  return (
    <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] p-2">
      <ul className="space-y-1">{tree.map((node) => renderNode(node))}</ul>
    </div>
  );
}

function containsCategoryOption(node: CategoryOptionNode, id: string): boolean {
  return node.id === id || node.children.some((child) => containsCategoryOption(child, id));
}

export function NewDashboardForm({ categoryOptions }: { categoryOptions: CategoryOption[] }) {
  return <DashboardMetadataForm categoryOptions={categoryOptions} mode="create" canManageStatus={false} />;
}

export function EditDashboardForm({
  categoryOptions,
  dashboard,
  canManageStatus,
}: {
  categoryOptions: CategoryOption[];
  dashboard: Dashboard;
  canManageStatus: boolean;
}) {
  return (
    <DashboardMetadataForm
      categoryOptions={categoryOptions}
      dashboard={dashboard}
      mode="edit"
      canManageStatus={canManageStatus}
    />
  );
}

function DashboardMetadataForm({
  categoryOptions,
  dashboard,
  mode,
  canManageStatus,
}: {
  categoryOptions: CategoryOption[];
  dashboard?: Dashboard;
  mode: "create" | "edit";
  canManageStatus: boolean;
}) {
  const [state, setState] = useState<FormState>({
    title: dashboard?.title ?? "",
    provider: dashboard?.provider ?? "BI",
    description: dashboard?.description ?? "",
    categoryId: dashboard?.categoryId ?? categoryOptions[0]?.id ?? "",
    status: dashboard?.status ?? "draft",
    sensitivity: dashboard?.sensitivity ?? "internal",
    embedUrl: dashboard?.embedUrl ?? "",
    externalUrl: dashboard?.externalUrl ?? "",
    tags: dashboard?.tags.join(", ") ?? "",
    refreshFrequency: dashboard?.refreshFrequency ?? "unknown",
    dataSourceNote: dashboard?.dataSourceNote ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; link?: { href: string; label: string } } | null>(null);
  const [savedDashboard, setSavedDashboard] = useState<CreatedDashboardResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [healthResult, setHealthResult] = useState<EmbedHealthResult | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const previewUrl = useMemo(() => {
    return isHttpsUrl(state.embedUrl) ? state.embedUrl : "";
  }, [state.embedUrl]);

  const embedAssessment = useMemo(() => {
    return assessEmbedUrl(state.provider, state.embedUrl);
  }, [state.embedUrl, state.provider]);

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setState((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSavedDashboard(null);
    if (key === "embedUrl" || key === "provider") {
      setHealthResult(null);
    }
  }

  async function checkEmbedHealth() {
    if (!isHttpsUrl(state.embedUrl)) {
      setErrors((current) => ({ ...current, embedUrl: "Embed URL ต้องเป็น HTTPS URL ที่ถูกต้อง" }));
      return;
    }

    setIsCheckingHealth(true);
    setHealthResult(null);

    try {
      const response = await fetch("/api/embed/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: state.embedUrl }),
      });
      const result = (await response.json()) as EmbedHealthResult;
      setHealthResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถตรวจสอบ Embed URL ได้";
      setHealthResult({
        status: "unknown",
        label: "ตรวจสอบไม่สำเร็จ",
        reason: message,
        recommendation: "ควรเก็บ external fallback URL ไว้เสมอ",
        checkedAt: new Date().toISOString(),
        headers: null,
      });
    } finally {
      setIsCheckingHealth(false);
    }
  }

  async function handleSubmit(intent: SubmitIntent) {
    const nextErrors = validateForm(state, intent);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const status = intent === "draft" ? "draft" : "in_review";
    setIsSubmitting(true);
    setToast(null);
    setSavedDashboard(null);

    try {
      const response = await fetch(mode === "edit" && dashboard ? `/api/dashboards/${dashboard.id}` : "/api/dashboards", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: state.title,
          provider: state.provider,
          description: state.description,
          categoryId: state.categoryId,
          ...(mode === "edit" && canManageStatus ? { status: state.status } : {}),
          sensitivity: state.sensitivity,
          embedUrl: state.embedUrl,
          externalUrl: state.externalUrl,
          tags: state.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          refreshFrequency: state.refreshFrequency,
          dataSourceNote: state.dataSourceNote,
          ...(mode === "create" ? { status } : {}),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        const message = Array.isArray(payload.errors)
          ? payload.errors.join(", ")
          : payload.error ?? "ไม่สามารถบันทึกรายงานได้";
        setToast({ message, type: "error" });
        return;
      }

      const result: CreatedDashboardResult = {
        id: payload.dashboard.id,
        title: payload.dashboard.title,
        status: payload.dashboard.status,
      };
      setSavedDashboard(result);
      setToast({
        message: mode === "edit" ? "บันทึกการแก้ไขเรียบร้อยแล้ว" : "บันทึกรายงานเรียบร้อยแล้ว",
        type: "success",
        link: { href: `/dashboards/${result.id}`, label: "เปิดรายงาน →" },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถบันทึกรายงานได้";
      setToast({ message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-[oklch(0.91_0.006_250)] bg-white p-5 shadow-sm">
      <div className="border-b border-[oklch(0.91_0.006_250)] pb-4">
        <h2 className="text-lg font-semibold tracking-tight">
          {mode === "edit" ? "แก้ไขข้อมูลกำกับรายงาน" : "ข้อมูลกำกับรายงาน"}
        </h2>
        <p className="mt-1 text-sm text-[oklch(0.5_0.012_255)]">
          {mode === "edit"
            ? "อัปเดตข้อมูลกำกับ URL หมวดรายงาน และบันทึกประวัติการเปลี่ยนแปลง"
            : "ฟอร์มนี้ใช้เพิ่มรายงานเข้าสู่ระบบและบันทึกเป็นฉบับร่างก่อนเผยแพร่"}
        </p>
      </div>

      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          link={toast.link}
          onDismiss={() => setToast(null)}
        />
      ) : null}

      <form className="mt-5 space-y-5" onSubmit={(event) => event.preventDefault()}>
        <div className="flex items-center gap-3 pb-1">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[oklch(0.5_0.012_255)]">ข้อมูลพื้นฐาน</h3>
          <div className="h-px flex-1 bg-[oklch(0.91_0.006_250)]" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">ชื่อรายงาน</span>
            <input
              className={`${fieldStyles} mt-2 h-11 w-full`}
              placeholder="เช่น ICU Bed Situation"
              value={state.title}
              onChange={(event) => updateField("title", event.target.value)}
            />
            <FieldError message={errors.title} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">Provider</span>
            <select
              className={`${fieldStyles} mt-2 h-11 w-full text-[oklch(0.3_0.018_255)]`}
              value={state.provider}
              onChange={(event) => updateField("provider", event.target.value as DashboardProvider)}
            >
              {providerOptions.map((provider) => (
                <option key={provider}>{provider}</option>
              ))}
            </select>
            <p className="mt-2 text-sm text-[oklch(0.5_0.012_255)]">{getProviderHint(state.provider)}</p>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">คำอธิบาย</span>
          <textarea
            className={`${fieldStyles} mt-2 min-h-28 w-full py-3 leading-6`}
            placeholder="อธิบายว่ารายงานนี้ใช้ตอบคำถามอะไร ใครเป็นผู้รับผิดชอบ และข้อมูลควรถูกใช้อย่างไร"
            value={state.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
          <FieldError message={errors.description} />
        </label>

        <div className="flex items-center gap-3 pb-1 pt-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[oklch(0.5_0.012_255)]">การเข้าถึงและหมวดหมู่</h3>
          <div className="h-px flex-1 bg-[oklch(0.91_0.006_250)]" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">หมวดรายงานที่มีสิทธิ์</span>
            <input
              type="hidden"
              value={state.categoryId}
              onChange={() => undefined}
            />
            <CategoryTreePicker
              options={categoryOptions}
              value={state.categoryId}
              onChange={(categoryId) => updateField("categoryId", categoryId)}
            />
            <FieldError message={errors.categoryId} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">ระดับข้อมูล</span>
            <select
              className={`${fieldStyles} mt-2 h-11 w-full text-[oklch(0.3_0.018_255)]`}
              value={state.sensitivity}
              onChange={(event) => updateField("sensitivity", event.target.value as SensitivityLevel)}
            >
              {sensitivityOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        {mode === "edit" && canManageStatus ? (
          <label className="block">
            <span className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">สถานะรายงาน</span>
            <select
              className={`${fieldStyles} mt-2 h-11 w-full text-[oklch(0.3_0.018_255)]`}
              value={state.status}
              onChange={(event) => updateField("status", event.target.value as DashboardStatus)}
            >
              <option value="draft">ร่าง</option>
              <option value="published">เผยแพร่แล้ว</option>
              <option value="archived">เก็บถาวร</option>
            </select>
            <p className="mt-2 text-sm text-[oklch(0.5_0.012_255)]">
              ใช้เผยแพร่หรือเก็บถาวรรายงานโดยตรง ในช่วงที่ยังไม่ใช้คิวตรวจสอบ
            </p>
          </label>
        ) : null}

        <div className="flex items-center gap-3 pb-1 pt-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[oklch(0.5_0.012_255)]">การฝังรายงาน</h3>
          <div className="h-px flex-1 bg-[oklch(0.91_0.006_250)]" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">Embed URL ของรายงาน</span>
            <input
              className={`${fieldStyles} mt-2 h-11 w-full`}
              placeholder="https://..."
              value={state.embedUrl}
              onChange={(event) => updateField("embedUrl", event.target.value)}
            />
            <FieldError message={errors.embedUrl} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">
              URL สำหรับเปิดภายนอก <span className="font-normal text-[oklch(0.66_0.01_255)]">(ไม่บังคับ)</span>
            </span>
            <input
              className={`${fieldStyles} mt-2 h-11 w-full`}
              placeholder="https://..."
              value={state.externalUrl}
              onChange={(event) => updateField("externalUrl", event.target.value)}
            />
            <FieldError message={errors.externalUrl} />
          </label>
        </div>

        <div className="flex items-center gap-3 pb-1 pt-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[oklch(0.5_0.012_255)]">ข้อมูลเพิ่มเติม</h3>
          <div className="h-px flex-1 bg-[oklch(0.91_0.006_250)]" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">Tags</span>
            <input
              className={`${fieldStyles} mt-2 h-11 w-full`}
              placeholder="KPI, ICU, จังหวัด"
              value={state.tags}
              onChange={(event) => updateField("tags", event.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">ความถี่การอัปเดต</span>
            <select
              className={`${fieldStyles} mt-2 h-11 w-full text-[oklch(0.3_0.018_255)]`}
              value={state.refreshFrequency}
              onChange={(event) => updateField("refreshFrequency", event.target.value as RefreshFrequency)}
            >
              {refreshFrequencyOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">แหล่งข้อมูลและข้อจำกัด</span>
          <textarea
            className={`${fieldStyles} mt-2 min-h-24 w-full py-3 leading-6`}
            placeholder="ระบุแหล่งข้อมูล เงื่อนไขการตีความ หรือข้อจำกัดที่ผู้ใช้งานควรรู้"
            value={state.dataSourceNote}
            onChange={(event) => updateField("dataSourceNote", event.target.value)}
          />
          <FieldError message={errors.dataSourceNote} />
        </label>

        {state.embedUrl.trim() ? <section className="overflow-hidden rounded-lg border border-[oklch(0.91_0.006_250)]">
          <div className="flex flex-col gap-3 border-b border-[oklch(0.91_0.006_250)] bg-[oklch(0.955_0.005_250)] px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">ตัวอย่างการแสดงรายงาน</h3>
              <p className="mt-1 text-sm text-[oklch(0.5_0.012_255)]">{embedAssessment.reason}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`w-fit rounded-md border px-2 py-1 text-xs font-semibold ${getEmbedStatusTone(embedAssessment.status)}`}
              >
                {embedAssessment.label}
              </span>
              <button
                type="button"
                className={`${buttonStyles.secondary} h-9 px-3`}
                disabled={!previewUrl || isCheckingHealth}
                onClick={checkEmbedHealth}
              >
                {isCheckingHealth ? "กำลังตรวจ..." : "ตรวจการฝังรายงาน"}
              </button>
            </div>
          </div>
          {healthResult ? (
            <div className="border-b border-[oklch(0.91_0.006_250)] px-4 py-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div
                    className={`w-fit rounded-md border px-2 py-1 text-xs font-semibold ${getEmbedStatusTone(healthResult.status)}`}
                  >
                    {healthResult.label}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[oklch(0.5_0.012_255)]">{healthResult.reason}</p>
                  <p className="mt-1 text-sm leading-6 text-[oklch(0.5_0.012_255)]">{healthResult.recommendation}</p>
                </div>
                <div className="text-sm text-[oklch(0.5_0.012_255)] md:text-right">
                  <div>ตรวจเมื่อ {new Date(healthResult.checkedAt).toLocaleString()}</div>
                  {healthResult.headers ? (
                    <>
                      <div className="mt-1">HTTP {healthResult.headers.httpStatus}</div>
                      <div className="mt-1">Server: {healthResult.headers.server ?? "unknown"}</div>
                    </>
                  ) : null}
                </div>
              </div>
              {healthResult.headers ? (
                <dl className="mt-3 grid gap-2 rounded-md bg-[oklch(0.955_0.005_250)] p-3 text-xs text-[oklch(0.5_0.012_255)] md:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-[oklch(0.3_0.018_255)]">X-Frame-Options</dt>
                    <dd className="mt-1 break-words">{healthResult.headers.xFrameOptions ?? "not present"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[oklch(0.3_0.018_255)]">Content-Security-Policy</dt>
                    <dd className="mt-1 break-words">
                      {healthResult.headers.contentSecurityPolicy ?? "not present"}
                    </dd>
                  </div>
                </dl>
              ) : null}
            </div>
          ) : null}
          {previewUrl && embedAssessment.status !== "external_only" ? (
            <iframe
              title="Report embed preview"
              src={previewUrl}
              className="h-80 w-full bg-[oklch(0.998_0.002_250)]"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
            />
          ) : (
            <div className="flex h-48 flex-col items-center justify-center px-4 text-center text-sm text-[oklch(0.5_0.012_255)]">
              <p>{embedAssessment.recommendation}</p>
              {previewUrl && embedAssessment.status === "external_only" ? (
                <a
                  href={previewUrl}
                  className={`${buttonStyles.secondary} mt-3 h-9 px-3`}
                  target="_blank"
                  rel="noreferrer"
                >
                  เปิด URL ภายนอก
                </a>
              ) : null}
            </div>
          )}
        </section> : null}

        <div className="flex flex-wrap justify-end gap-2 border-t border-[oklch(0.91_0.006_250)] pt-5">
          {mode === "create" ? (
            <button
              type="button"
              className={`${buttonStyles.primary} h-10`}
              disabled={isSubmitting}
              onClick={() => handleSubmit("draft")}
            >
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกฉบับร่าง"}
            </button>
          ) : (
            <button
              type="button"
              className={`${buttonStyles.primary} h-10`}
              disabled={isSubmitting}
              onClick={() => handleSubmit("save")}
            >
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
