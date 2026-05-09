# Dashboard Hub

Governed Dashboard Portal สำหรับบริหารจัดการ dashboard แบบ embed จากระบบภายนอก เช่น Looker Studio, Superset, Grafana, Metabase, Power BI หรือ provider อื่น ๆ

แนวคิดหลักของระบบคือให้หน่วยงานมีศูนย์กลางสำหรับจัดหมวดหมู่ dashboard, กำหนดสิทธิ์, ค้นหา, pin รายการสำคัญ, แยกข้อมูล public/internal และเตรียมต่อยอด workflow แบบ review/publish ในอนาคต

## Screenshots

### Internal Portal

มุมมองผู้ใช้ที่ login แล้วผ่าน mock SSO session พร้อม role, category tree, dashboard ยอดนิยม, รายการล่าสุด, dashboard ของทีม และ favorite

![Internal Portal](public/screenshort/ss1.png)

### Public Dashboard Center

หน้า public สำหรับประชาชนทั่วไป เปิดดู dashboard ที่เป็นข้อมูลสาธารณะได้โดยไม่ต้อง login

![Public Dashboard Center](public/screenshort/ss2.png)

## Current Scope

ตอนนี้ระบบเริ่มขยับจาก mock UI ไปสู่ DB-backed MVP แล้ว โดย MySQL ใช้ค่าจาก `.env`

- หน้า internal portal ที่ `/`
- หน้า public portal ที่ `/public`
- หน้า dashboard catalog ที่ `/catalog`
- หน้า embedded dashboard viewer ที่ `/dashboards/[id]`
- หน้า mock create dashboard ที่ `/dashboards/new`
- หน้า mock review queue ที่ `/review`
- หน้า mock audit log ที่ `/audit`
- MySQL migration สำหรับ schema หลักใน `migrations/001_init_dashboard_portal.sql`
- DB-backed API:
  - `GET /api/categories`
  - `GET /api/dashboards`
  - `POST /api/dashboards`
- Provider ID SSO login flow:
  - `/login`
  - `/api/auth/start`
  - `/api/auth/callback`
  - `/api/auth/logout`
- `/catalog` อ่านข้อมูลจาก MySQL จริง
- `/dashboards/new` submit dashboard ลง MySQL จริง
- `/dashboards/[id]` โหลด dashboard จาก MySQL จริง
- Phase 4 Home discovery signals: pending review, recently published, external-only, quick actions
- client-side validation, iframe preview และ mock submit result สำหรับ create flow
- embed status policy: embeddable, unknown, external_only, blocked
- server-side embed health check ที่ `POST /api/embed/check`
- mock SSO user, roles และ team
- mock category tree
- mock dashboard catalog
- section หน้า Home: pinned, popular, recently updated, my team, favorites
- แยก public dashboard ด้วย `status: published` และ `sensitivity: public`
- fallback link สำหรับเปิด dashboard provider ภายนอก

## Routes

| Route | Description |
| --- | --- |
| `/` | Internal dashboard portal สำหรับผู้ใช้ที่ login แล้ว |
| `/public` | Public dashboard center สำหรับประชาชนทั่วไป |
| `/catalog` | Internal dashboard catalog พร้อม action ตาม permission mock |
| `/dashboards/db-001` | Embedded dashboard viewer ตัวอย่างด้วย Looker Studio |
| `/dashboards/new` | Mock create dashboard form |
| `/review` | Mock governance workflow สำหรับ approve/reject |
| `/audit` | Mock audit log สำหรับ governance activity |
| `/login` | หน้าเข้าสู่ระบบด้วย Provider ID SSO |
| `/api/auth/start` | เริ่ม SSO authorization redirect พร้อม state cookie |
| `/api/auth/callback` | รับ callback, ตรวจ state, exchange code และสร้าง session |
| `/api/auth/logout` | ลบ session cookie ของ Dashboard Hub |
| `/api/embed/check` | Server-side URL/header check สำหรับ embed health |
| `/api/categories` | DB-backed categories API |
| `/api/dashboards` | DB-backed dashboards API |

## Project Structure

```text
src/
  app/
    page.tsx              # Internal portal home
    catalog/page.tsx      # Internal catalog management
    dashboards/[id]/page.tsx # Embedded dashboard viewer
    dashboards/new/page.tsx # Mock create dashboard route
    dashboards/new/new-dashboard-form.tsx # Client form validation and preview
    review/page.tsx       # Mock governance review route
    review/review-queue.tsx # Client approve/reject state and audit trail
    audit/page.tsx        # Mock audit log route
    api/embed/check/route.ts # Server-side embed health checker
    api/auth/start/route.ts # Start Provider ID SSO authorization flow
    api/auth/callback/route.ts # Exchange SSO code and create app session
    api/auth/logout/route.ts # Clear app session
    login/page.tsx          # SSO login screen
    api/categories/route.ts # DB-backed categories API
    api/dashboards/route.ts # DB-backed dashboards API
    public/page.tsx       # Public dashboard center
    layout.tsx
    globals.css
  lib/
    db/connection.ts      # MySQL connection pool
    db/categories.ts      # Category repository
    db/dashboards.ts      # Dashboard repository
    portal-types.ts       # Shared roles, permissions, user, category, dashboard types
    mock-auth.ts          # Mock JWT payload and current user mapping
    permissions.ts        # Permission helper functions
    category-utils.ts     # Category tree helpers
    embed-policy.ts       # Embed URL assessment and status tone helpers
    mock-portal-data.ts   # Mock categories and dashboards

docs/
  1.governed-dashboard-portal-phases.md
  2.roles-permissions.md
  3.category-dashboard-model.md
  4.embed-provider-strategy.md
  5.workflow-governance.md
  6.home-discovery.md

public/
  screenshort/
    ss1.png
    ss2.png
```

## Database

Run migration:

```bash
npm run db:migrate
```

The migration creates the database if needed, creates portal tables, and seeds initial teams, categories, scopes, and sample dashboards.

## Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

- [http://localhost:3000](http://localhost:3000)
- [http://localhost:3000/public](http://localhost:3000/public)

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Auth

ระบบรองรับ Provider ID SSO ตามคู่มือ client app integration โดยใช้ authorization code flow และสร้าง session ของ Dashboard Hub เองหลัง callback สำเร็จ

ตั้งค่า environment ฝั่ง server:

```text
PORTAL_AUTH_MODE=sso-session
SSO_URL=http://localhost:3000
SSO_CLIENT_ID=your-client-id
SSO_CLIENT_SECRET=your-client-secret
SSO_REDIRECT_URI=http://localhost:3000/api/auth/callback
PORTAL_SESSION_SECRET=long-random-session-signing-secret
```

หมายเหตุ:

- `SSO_CLIENT_SECRET` และ `PORTAL_SESSION_SECRET` ต้องอยู่ฝั่ง server เท่านั้น
- ถ้าไม่ตั้ง `SSO_REDIRECT_URI` ระบบจะ derive จาก origin ของ request เป็น `/api/auth/callback`
- `PORTAL_DEFAULT_ROLES` สามารถกำหนด role เริ่มต้นแบบ comma-separated เช่น `viewer,editor`
- `PORTAL_DEFAULT_CATEGORY_IDS` ใช้ผูก scope หมวดหมู่เริ่มต้นแบบ comma-separated
- development ยัง default เป็น `PORTAL_AUTH_MODE=dev` เพื่อใช้ mock user ได้เหมือนเดิม

## Roadmap

เอกสาร phase หลักอยู่ที่:

[docs/1.governed-dashboard-portal-phases.md](docs/1.governed-dashboard-portal-phases.md)

เอกสาร role/permission และ data model:

- [docs/2.roles-permissions.md](docs/2.roles-permissions.md)
- [docs/3.category-dashboard-model.md](docs/3.category-dashboard-model.md)
- [docs/4.embed-provider-strategy.md](docs/4.embed-provider-strategy.md)
- [docs/5.workflow-governance.md](docs/5.workflow-governance.md)
- [docs/6.home-discovery.md](docs/6.home-discovery.md)

phase ที่ควรต่อยอด:

- dashboard CRUD
- real form submission and validation
- embed provider strategy
- publish/review workflow
- usage analytics และ stale dashboard warning
