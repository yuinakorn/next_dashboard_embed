"use client";

import { useMemo, useState } from "react";
import type { CategoryOption } from "@/lib/category-utils";
import { assessEmbedUrl, getEmbedStatusTone } from "@/lib/embed-policy";
import type { EmbedHealthResult } from "@/lib/embed-policy";
import type { DashboardProvider, SensitivityLevel } from "@/lib/portal-types";

type SubmitIntent = "draft" | "review";

type FormState = {
  title: string;
  provider: DashboardProvider;
  description: string;
  categoryId: string;
  sensitivity: SensitivityLevel;
  embedUrl: string;
  externalUrl: string;
  tags: string;
  refreshFrequency: string;
  dataSourceNote: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type CreatedDashboardResult = {
  id: string;
  title: string;
  status: string;
};

const providerOptions: DashboardProvider[] = [
  "Looker Studio",
  "Superset",
  "Grafana",
  "Metabase",
  "Power BI",
  "Custom",
];

const sensitivityOptions: SensitivityLevel[] = ["public", "internal", "confidential", "restricted"];

const refreshFrequencyOptions = ["unknown", "daily", "weekly", "monthly", "manual"];

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
  if (provider === "Looker Studio") {
    return "Looker Studio embed URL should usually contain /embed/reporting/.";
  }

  if (provider === "Superset") {
    return "Superset may require guest token or public dashboard configuration.";
  }

  if (provider === "Power BI") {
    return "Power BI private reports may require Microsoft auth in the embedded frame.";
  }

  return "If this provider blocks iframe, users can still open the external fallback.";
}

function validateForm(state: FormState, intent: SubmitIntent): FormErrors {
  const errors: FormErrors = {};

  if (!state.title.trim()) {
    errors.title = "Dashboard title is required.";
  }

  if (state.description.trim().length < 20) {
    errors.description = "Description should explain the dashboard purpose.";
  }

  if (!state.categoryId) {
    errors.categoryId = "Choose an allowed category.";
  }

  if (!isHttpsUrl(state.embedUrl)) {
    errors.embedUrl = "Embed URL must be a valid HTTPS URL.";
  }

  if (!isHttpsUrl(state.externalUrl)) {
    errors.externalUrl = "Fallback URL must be a valid HTTPS URL.";
  }

  if (state.sensitivity === "public" && intent === "review" && !state.dataSourceNote.trim()) {
    errors.dataSourceNote = "Public dashboards need a data source note before review.";
  }

  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-rose-600">{message}</p>;
}

export function NewDashboardForm({ categoryOptions }: { categoryOptions: CategoryOption[] }) {
  const [state, setState] = useState<FormState>({
    title: "",
    provider: "Looker Studio",
    description: "",
    categoryId: categoryOptions[0]?.id ?? "",
    sensitivity: "internal",
    embedUrl: "",
    externalUrl: "",
    tags: "",
    refreshFrequency: "unknown",
    dataSourceNote: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const [submitResultType, setSubmitResultType] = useState<"success" | "error">("success");
  const [createdDashboard, setCreatedDashboard] = useState<CreatedDashboardResult | null>(null);
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
    setSubmitResult(null);
    setSubmitResultType("success");
    setCreatedDashboard(null);
    if (key === "embedUrl" || key === "provider") {
      setHealthResult(null);
    }
  }

  async function checkEmbedHealth() {
    if (!isHttpsUrl(state.embedUrl)) {
      setErrors((current) => ({ ...current, embedUrl: "Embed URL must be a valid HTTPS URL." }));
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
      const message = error instanceof Error ? error.message : "Unable to check embed URL.";
      setHealthResult({
        status: "unknown",
        label: "Health check failed",
        reason: message,
        recommendation: "Keep the external fallback URL available.",
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
      setSubmitResult(null);
      return;
    }

    const status = intent === "draft" ? "draft" : "in_review";
    setIsSubmitting(true);
    setSubmitResult(null);
    setCreatedDashboard(null);

    try {
      const response = await fetch("/api/dashboards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: state.title,
          provider: state.provider,
          description: state.description,
          categoryId: state.categoryId,
          sensitivity: state.sensitivity,
          embedUrl: state.embedUrl,
          externalUrl: state.externalUrl,
          tags: state.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          refreshFrequency: state.refreshFrequency,
          dataSourceNote: state.dataSourceNote,
          status,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        const message = Array.isArray(payload.errors)
          ? payload.errors.join(", ")
          : payload.error ?? "Unable to save dashboard.";
        setSubmitResult(message);
        setSubmitResultType("error");
        return;
      }

      setCreatedDashboard({
        id: payload.dashboard.id,
        title: payload.dashboard.title,
        status: payload.dashboard.status,
      });
      setSubmitResult(`Saved as ${payload.dashboard.status} in MySQL.`);
      setSubmitResultType("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save dashboard.";
      setSubmitResult(message);
      setSubmitResultType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="border-b border-zinc-200 pb-4">
        <h2 className="text-lg font-semibold">Dashboard Metadata</h2>
        <p className="mt-1 text-sm text-zinc-500">
          This form validates locally and returns a mock submit result. Persistence will be added with the database layer.
        </p>
      </div>

      {submitResult ? (
        <div
          className={`mt-5 rounded-lg border p-4 text-sm font-medium ${
            submitResultType === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {submitResult}
          {createdDashboard ? (
            <a
              href={`/dashboards/${createdDashboard.id}`}
              className="ml-3 underline"
            >
              Open {createdDashboard.title}
            </a>
          ) : null}
        </div>
      ) : null}

      <form className="mt-5 space-y-5" onSubmit={(event) => event.preventDefault()}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Dashboard title</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-500"
              placeholder="เช่น ICU Bed Situation"
              value={state.title}
              onChange={(event) => updateField("title", event.target.value)}
            />
            <FieldError message={errors.title} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Provider</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-zinc-500"
              value={state.provider}
              onChange={(event) => updateField("provider", event.target.value as DashboardProvider)}
            >
              {providerOptions.map((provider) => (
                <option key={provider}>{provider}</option>
              ))}
            </select>
            <p className="mt-2 text-sm text-zinc-500">{getProviderHint(state.provider)}</p>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Description</span>
          <textarea
            className="mt-2 min-h-28 w-full rounded-md border border-zinc-300 px-3 py-3 text-sm leading-6 outline-none placeholder:text-zinc-400 focus:border-zinc-500"
            placeholder="อธิบายว่า dashboard นี้ใช้ตอบคำถามอะไร ใครเป็นผู้รับผิดชอบ และข้อมูลควรถูกใช้อย่างไร"
            value={state.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
          <FieldError message={errors.description} />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Category scope</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-zinc-500"
              value={state.categoryId}
              onChange={(event) => updateField("categoryId", event.target.value)}
            >
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {"- ".repeat(category.depth)}
                  {category.name}
                </option>
              ))}
            </select>
            <FieldError message={errors.categoryId} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Sensitivity</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-zinc-500"
              value={state.sensitivity}
              onChange={(event) => updateField("sensitivity", event.target.value as SensitivityLevel)}
            >
              {sensitivityOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Embed URL</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-500"
              placeholder="https://..."
              value={state.embedUrl}
              onChange={(event) => updateField("embedUrl", event.target.value)}
            />
            <FieldError message={errors.embedUrl} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">External fallback URL</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-500"
              placeholder="https://..."
              value={state.externalUrl}
              onChange={(event) => updateField("externalUrl", event.target.value)}
            />
            <FieldError message={errors.externalUrl} />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Tags</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-500"
              placeholder="KPI, ICU, จังหวัด"
              value={state.tags}
              onChange={(event) => updateField("tags", event.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Refresh frequency</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-zinc-500"
              value={state.refreshFrequency}
              onChange={(event) => updateField("refreshFrequency", event.target.value)}
            >
              {refreshFrequencyOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Data source note</span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-3 text-sm leading-6 outline-none placeholder:text-zinc-400 focus:border-zinc-500"
            placeholder="ระบุแหล่งข้อมูล เงื่อนไขการตีความ หรือข้อจำกัดที่ผู้ใช้งานควรรู้"
            value={state.dataSourceNote}
            onChange={(event) => updateField("dataSourceNote", event.target.value)}
          />
          <FieldError message={errors.dataSourceNote} />
        </label>

        <section className="overflow-hidden rounded-lg border border-zinc-200">
          <div className="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-800">Embed preview</h3>
              <p className="mt-1 text-sm text-zinc-500">{embedAssessment.reason}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`w-fit rounded-md border px-2 py-1 text-xs font-medium ${getEmbedStatusTone(embedAssessment.status)}`}
              >
                {embedAssessment.label}
              </span>
              <button
                type="button"
                className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!previewUrl || isCheckingHealth}
                onClick={checkEmbedHealth}
              >
                {isCheckingHealth ? "Checking..." : "Check embed health"}
              </button>
            </div>
          </div>
          {healthResult ? (
            <div className="border-b border-zinc-200 px-4 py-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div
                    className={`w-fit rounded-md border px-2 py-1 text-xs font-medium ${getEmbedStatusTone(healthResult.status)}`}
                  >
                    {healthResult.label}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{healthResult.reason}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">{healthResult.recommendation}</p>
                </div>
                <div className="text-sm text-zinc-500 md:text-right">
                  <div>Checked {new Date(healthResult.checkedAt).toLocaleString()}</div>
                  {healthResult.headers ? (
                    <>
                      <div className="mt-1">HTTP {healthResult.headers.httpStatus}</div>
                      <div className="mt-1">Server: {healthResult.headers.server ?? "unknown"}</div>
                    </>
                  ) : null}
                </div>
              </div>
              {healthResult.headers ? (
                <dl className="mt-3 grid gap-2 rounded-md bg-zinc-50 p-3 text-xs text-zinc-600 md:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-zinc-800">X-Frame-Options</dt>
                    <dd className="mt-1 break-words">{healthResult.headers.xFrameOptions ?? "not present"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-zinc-800">Content-Security-Policy</dt>
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
              title="New dashboard embed preview"
              src={previewUrl}
              className="h-80 w-full bg-white"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
            />
          ) : (
            <div className="flex h-48 flex-col items-center justify-center px-4 text-center text-sm text-zinc-500">
              <p>{embedAssessment.recommendation}</p>
              {previewUrl && embedAssessment.status === "external_only" ? (
                <a
                  href={previewUrl}
                  className="mt-3 inline-flex h-9 items-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open external URL
                </a>
              ) : null}
            </div>
          )}
        </section>

        <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-200 pt-5">
          <button
            type="button"
            className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            disabled={isSubmitting}
            onClick={() => handleSubmit("draft")}
          >
            {isSubmitting ? "Saving..." : "Save draft"}
          </button>
          <button
            type="button"
            className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
            disabled={isSubmitting}
            onClick={() => handleSubmit("review")}
          >
            {isSubmitting ? "Saving..." : "Submit for review"}
          </button>
        </div>
      </form>
    </section>
  );
}
