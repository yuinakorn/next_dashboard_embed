import { buttonStyles } from "@/components/dashboard-ui";
import Link from "next/link";
import packageJson from "../../../package.json";
import { AbstractHero } from "./abstract-hero";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getNextPath(value: string | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

const errorMessages: Record<string, string> = {
  "Invalid SSO callback state.":
    "การยืนยันตัวตนหมดเวลา กรุณาลองใหม่อีกครั้ง",
  "SSO token exchange failed.":
    "ไม่สามารถเชื่อมต่อระบบยืนยันตัวตนได้ กรุณาลองใหม่ภายหลัง",
  "SSO token response did not include a user profile.":
    "ไม่พบข้อมูลผู้ใช้จากระบบยืนยันตัวตน กรุณาติดต่อผู้ดูแลระบบ",
  "SSO client configuration is incomplete.":
    "ระบบยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
};

const appVersion = packageJson.version;

function sanitizeError(raw: string | undefined): string | null {
  if (!raw) {
    return null;
  }

  return errorMessages[raw] ?? "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const nextPath = getNextPath(firstParam(params.next));
  const errorMessage = sanitizeError(firstParam(params.error));
  const loggedOut = firstParam(params.logged_out) === "1";
  const ssoReady = Boolean(
    process.env.SSO_URL && process.env.SSO_CLIENT_ID && process.env.SSO_CLIENT_SECRET,
  );

  const currentYear = new Date().getFullYear();

  return (
    <main className="flex min-h-screen flex-col bg-[oklch(0.985_0.003_250)] text-[oklch(0.21_0.015_255)]">
      <div className="mx-auto flex w-full max-w-5xl flex-1 items-center px-5 py-10">
        <section className="grid w-full overflow-hidden rounded-lg border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] shadow-sm lg:grid-cols-[minmax(0,1.222fr)_minmax(0,1fr)]">
          {/* Left panel: product context */}
          <AbstractHero />

          {/* Right panel: login action */}
          <div className="p-6 sm:p-8">
            <div className="max-w-md">
              <p className="text-sm font-semibold text-[oklch(0.5_0.012_255)]">เข้าสู่ระบบ</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[oklch(0.21_0.015_255)]">
                ยืนยันตัวตนผ่านระบบกลาง
              </h2>
              <p className="mt-3 text-sm leading-6 text-[oklch(0.5_0.012_255)]">
                ระบบจะนำคุณไปยังหน้ายืนยันตัวตนของหน่วยงาน
                และพากลับมาหลังเข้าสู่ระบบสำเร็จ
              </p>

              {errorMessage ? (
                <div
                  className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
                  role="alert"
                >
                  {errorMessage}
                </div>
              ) : null}

              {loggedOut ? (
                <div
                  className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
                  role="status"
                >
                  ออกจากระบบเรียบร้อยแล้ว
                </div>
              ) : null}

              {!ssoReady ? (
                <div
                  className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
                  role="alert"
                >
                  ระบบยืนยันตัวตนยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {ssoReady ? (
                  <a
                    href={`/api/auth/start?next=${encodeURIComponent(nextPath)}`}
                    className={`${buttonStyles.primary} h-11 justify-center`}
                  >
                    เข้าสู่ระบบ
                  </a>
                ) : (
                  <span
                    className={`${buttonStyles.primary} h-11 justify-center cursor-not-allowed opacity-50`}
                    aria-disabled="true"
                  >
                    เข้าสู่ระบบ
                  </span>
                )}
                <Link
                  href="/public"
                  className={`${buttonStyles.secondary} h-11 justify-center`}
                >
                  ดูข้อมูลสาธารณะ
                </Link>
              </div>

              <p className="mt-5 text-xs leading-5 text-[oklch(0.5_0.012_255)]">
                การเข้าสู่ระบบเป็นไปตามนโยบายความปลอดภัยของหน่วยงาน
              </p>

              <div className="mt-8 border-t border-[oklch(0.91_0.006_250)] pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[oklch(0.66_0.01_255)]">
                  ขั้นตอนการเข้าสู่ระบบ
                </p>
                <ol className="mt-4 space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[oklch(0.21_0.015_255)] text-xs font-semibold text-[oklch(0.998_0.002_250)]">
                      1
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">กดปุ่มเข้าสู่ระบบ</p>
                      <p className="mt-0.5 text-xs leading-5 text-[oklch(0.5_0.012_255)]">
                        ระบบจะนำคุณไปยังหน้ายืนยันตัวตนของหน่วยงาน
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[oklch(0.21_0.015_255)] text-xs font-semibold text-[oklch(0.998_0.002_250)]">
                      2
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">ยืนยันตัวตน</p>
                      <p className="mt-0.5 text-xs leading-5 text-[oklch(0.5_0.012_255)]">
                        เข้าสู่ระบบด้วยบัญชีที่ลงทะเบียนไว้กับหน่วยงาน
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[oklch(0.21_0.015_255)] text-xs font-semibold text-[oklch(0.998_0.002_250)]">
                      3
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">เข้าถึง Dashboard</p>
                      <p className="mt-0.5 text-xs leading-5 text-[oklch(0.5_0.012_255)]">
                        กลับมาที่ระบบพร้อมใช้งานตามสิทธิ์ที่ได้รับ
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-[oklch(0.91_0.006_250)]/70 bg-[oklch(0.985_0.003_250)]/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-[oklch(0.5_0.012_255)] sm:flex-row">
          <p className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0.18_150)]" aria-hidden="true" />
            <span>
              © {currentYear} สำนักงานสาธารณสุขจังหวัดเชียงใหม่
            </span>
            <span className="hidden text-[oklch(0.78_0.008_255)] sm:inline">·</span>
            <span className="hidden sm:inline">All rights reserved.</span>
          </p>
          <p className="flex items-center gap-3 font-mono tracking-tight text-[oklch(0.55_0.012_255)]">
            <span className="rounded-full border border-[oklch(0.91_0.006_250)] bg-white px-2.5 py-0.5">
              v{appVersion}
            </span>
          </p>
        </div>
      </footer>
    </main>
  );
}
