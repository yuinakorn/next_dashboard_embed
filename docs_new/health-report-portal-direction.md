# Health Report Portal Direction

เอกสารนี้สรุปทิศทางใหม่ของระบบ หลังจากปรับความเข้าใจว่าโปรเจกต์นี้ไม่ใช่ระบบแข่งขันทำ dashboard และไม่ใช่ open data catalog เต็มรูปแบบ แต่เป็น portal สำหรับรวบรวมและแสดงรายงานด้านสาธารณสุขของสำนักงานสาธารณสุขจังหวัดเชียงใหม่

## Product Positioning

ระบบควรถูกวางตำแหน่งเป็น:

> Health Report Portal สำหรับรวมรายงาน dashboard/embed ของสำนักงานสาธารณสุขจังหวัดเชียงใหม่ โดยมีทั้งรายงานสาธารณะ รายงานที่ต้อง login และรายงานที่จำกัดตามสิทธิ์

สิ่งที่ระบบควรเป็น:

- ศูนย์รวมรายงานด้านสาธารณสุขที่ประชาชนและบุคลากรเข้าถึงได้ตามสิทธิ์
- หน้า portal ที่จัดกลุ่มรายงานตามหมวดหมู่ด้านสาธารณสุข
- ระบบแสดงรายงานแบบ embedded dashboard เป็นหลัก
- ระบบที่มี metadata, owner, visibility, review และ governance เพียงพอสำหรับหน่วยงาน

สิ่งที่ระบบไม่ควรถูกออกแบบเป็น:

- ระบบให้พนักงานเข้ามาทำ dashboard แข่งขันกัน
- open data catalog เต็มรูปแบบที่เน้นไฟล์ dataset, license, API endpoint หรือ machine-readable download ตั้งแต่รอบแรก
- dashboard builder ภายในระบบเอง

## Core Domain

ควรเปลี่ยนภาษาของระบบจาก `dashboard` เป็น `report` ในระดับ product/domain แม้ว่าระยะสั้นอาจยังใช้ table หรือ code เดิมบางส่วนเพื่อไม่ให้กระทบมากเกินไป

คำที่ควรใช้ใน UI:

- รายงาน
- กลุ่มรายงาน
- หมวดหมู่รายงาน
- ตัวชี้วัด
- รายงานสาธารณะ
- รายงานที่ต้องเข้าสู่ระบบ

คำที่ควรลดความสำคัญ:

- Dashboard Hub
- Create Dashboard
- Dashboard แข่งขัน
- Open Data เต็มรูปแบบ

## Information Architecture

หน้า portal ควรรองรับโครงสร้างหลายชั้น เช่น:

```text
หมวดหมู่ด้านสาธารณสุข
- ข้อมูลทั่วไป
  - ประชากร
  - หน่วยบริการ
  - บุคลากร
- สถานะสุขภาพ
  - โรคติดต่อ
  - โรคไม่ติดต่อเรื้อรัง
    - เบาหวาน
    - ความดันโลหิตสูง
  - แม่และเด็ก
  - ผู้สูงอายุ
- การเข้าถึงบริการ
  - ผู้ป่วยนอก/ผู้ป่วยใน
  - อุบัติเหตุฉุกเฉิน
  - การส่งต่อ
- ส่งเสริมป้องกัน
  - วัคซีน
  - การคัดกรอง
  - อนามัยแม่และเด็ก
- ทรัพยากรและระบบบริการ
  - เตียง
  - ยาและเวชภัณฑ์
  - ระบบดิจิทัลสุขภาพ
```

ตัวอย่าง path ของรายงาน:

```text
สถานะสุขภาพ / โรคไม่ติดต่อเรื้อรัง / เบาหวาน / รายงานความครอบคลุมการคัดกรองเบาหวาน
```

ระบบจึงต้องรองรับความลึกแบบไม่ผูกกับจำนวนชั้นตายตัว ไม่ควรออกแบบเป็นเพียง `หมวดหมู่ -> รายงาน`

## Recommended Database Direction

### 1. Keep `portal_categories` As Taxonomy Tree

ตาราง `portal_categories` ปัจจุบันมี `parent_id` อยู่แล้ว จึงมีฐานสำหรับ tree structure แต่ควรขยายความสามารถให้เหมาะกับ taxonomy ของรายงาน

field ที่ควรพิจารณาเพิ่ม:

| Field | Purpose |
| --- | --- |
| `slug` | ใช้ทำ URL และ route ที่อ่านง่าย |
| `description` | คำอธิบายหมวดหมู่สำหรับหน้า portal |
| `node_type` | เช่น `category`, `report_group`, `indicator_group` |
| `icon_key` | ใช้เลือก icon หรือภาพประกอบในหน้า public |
| `image_url` | ใช้กรณีต้องมีภาพหมวดหมู่แบบตัวอย่าง HDC/Open Data |
| `is_public` | หมวดนี้แสดงในหน้า public หรือไม่ |
| `accepts_reports` | หมวดนี้สามารถผูกรายงานได้หรือเป็นแค่กลุ่มนำทาง |
| `sort_order` | ใช้เรียงในระดับเดียวกัน |

หมายเหตุ: `level`, `depth`, หรือ `path` อาจเก็บเป็น generated/cache field ได้ แต่ไม่ควรเป็น source of truth หากยังใช้ adjacency list ด้วย `parent_id`

### 2. Add `portal_category_closure`

ควรเพิ่ม closure table เพื่อให้ query กับ tree หลายชั้นง่ายและเร็วขึ้น

โครงสร้างหลัก:

```sql
CREATE TABLE portal_category_closure (
  ancestor_id VARCHAR(80) NOT NULL,
  descendant_id VARCHAR(80) NOT NULL,
  depth INT NOT NULL,
  PRIMARY KEY (ancestor_id, descendant_id),
  FOREIGN KEY (ancestor_id) REFERENCES portal_categories(id),
  FOREIGN KEY (descendant_id) REFERENCES portal_categories(id)
);
```

ตัวอย่างความหมาย:

```text
ancestor_id = สถานะสุขภาพ
descendant_id = เบาหวาน
depth = 2
```

ประโยชน์:

- เลือกหมวดแม่แล้วดึงรายงานใต้ลูกหลานทุกชั้นได้
- นับจำนวนรายงานรวมทั้ง subtree ได้
- ทำ breadcrumb ได้ง่ายขึ้น
- permission scope ที่หมวดแม่ครอบคลุมหมวดย่อยได้
- ไม่ต้องเขียน recursive logic ซ้ำในหลายจุดของ application

### 3. Treat Dashboard Records As Reports

ระยะสั้นอาจยังใช้ `portal_dashboards` ต่อเพื่อไม่กระทบ migration มาก แต่ใน domain ควรมอง entity นี้เป็น `report`

field เดิมที่ยังสำคัญ:

- `title`
- `description`
- `provider`
- `category_id`
- `embed_url`
- `external_url`
- `embed_status`
- `refresh_frequency`
- `data_source_note`
- `owner_team_id`
- `owner_user_id`
- `status`
- `sensitivity`

field ที่ควรเพิ่มหรือเปลี่ยนชื่อในอนาคต:

| Field | Purpose |
| --- | --- |
| `report_type` | เช่น `dashboard_embed`, `external_dashboard`, `standard_report` |
| `visibility` | แยกความหมายการเห็นรายงานให้ชัดกว่า sensitivity |
| `data_as_of` | วันที่ข้อมูลล่าสุด |
| `steward_name` | ผู้รับผิดชอบเชิงข้อมูลหรือหน่วยงานเจ้าของข้อมูล |
| `contact_note` | ช่องทางติดต่อหรือหมายเหตุผู้ดูแลรายงาน |
| `published_note` | คำอธิบายการเผยแพร่หรือข้อจำกัดการใช้งาน |

## Visibility Model

ระบบนี้มีทั้งรายงาน public และรายงานที่ต้อง login จึงควรแยก visibility ให้ชัด

ค่าที่แนะนำ:

| Visibility | Meaning |
| --- | --- |
| `public` | ไม่ต้อง login เห็นและเปิดรายงานได้ |
| `authenticated` | ต้อง login ก่อนจึงเปิดได้ |
| `restricted` | ต้อง login และมี role/scope ที่เกี่ยวข้อง |
| `internal` | ใช้ภายในหน่วยงาน อาจไม่แสดงต่อ public visitor |

ความสัมพันธ์กับ field เดิม:

- ตอนนี้มี `sensitivity = public/internal/confidential/restricted`
- ใช้ต่อได้ในระยะสั้น แต่ระยะถัดไปควรพิจารณาเพิ่ม `visibility`
- `sensitivity` ควรสื่อระดับความอ่อนไหวของข้อมูล
- `visibility` ควรสื่อเงื่อนไขการมองเห็น/การเข้าถึง

ตัวอย่าง rule:

```text
public visitor:
- เห็นหมวด public
- เห็นรายงาน visibility = public
- รายงานที่ต้อง login อาจแสดงเป็น locked card หรือซ่อน ขึ้นกับ policy

authenticated user:
- เห็นรายงาน public
- เห็นรายงาน authenticated
- เห็นรายงาน restricted เฉพาะเมื่อมี role/scope

admin/editor:
- เห็น draft/in_review ตาม permission และ owner scope
```

## Portal Behavior

### Public Visitor

ผู้ไม่ login ควรเห็น:

- หน้า landing/portal ที่เป็นหมวดหมู่ด้านสาธารณสุข
- จำนวนรายงาน public ในแต่ละหมวด โดยนับรวมรายงานใต้หมวดย่อย
- รายงาน public ที่เปิดดูได้ทันที
- ปุ่มเข้าสู่ระบบสำหรับรายงานที่ต้อง login หาก policy ต้องการให้แสดงรายการนั้น

### Logged In User

ผู้ login แล้วควรเห็น:

- หมวดหมู่เดียวกับ public แต่มีรายงานเพิ่มตามสิทธิ์
- รายงานที่ต้อง login
- รายงาน restricted ตาม role/scope
- breadcrumb เต็มของรายงาน

### Report Viewer

หน้ารายงานควรยังเน้น embedded dashboard:

- แสดง iframe/embed เป็นหลัก
- มี fallback link ไปยัง external dashboard
- มี metadata เช่น เจ้าของรายงาน, ปรับปรุงล่าสุด, ความถี่ปรับปรุง, หมวดหมู่, visibility
- ถ้า embed ไม่ได้ ให้แสดงเหตุผลและปุ่มเปิดแหล่งรายงาน

## Query Requirements

ระบบควรรองรับ query เหล่านี้โดยตรง:

1. ดึง root categories สำหรับหน้า portal
2. ดึง children ของ category
3. ดึง breadcrumb ของ category/report
4. นับจำนวน report ใต้ category รวม descendant ทุกชั้น
5. ดึง reports ทั้งหมดใต้ subtree ของ category
6. filter reports ตาม visibility และสิทธิ์ user
7. search report ด้วย title, description, tag, category path

ตัวอย่างแนวคิด query สำหรับ subtree:

```sql
SELECT r.*
FROM portal_dashboards r
JOIN portal_category_closure cc
  ON cc.descendant_id = r.category_id
WHERE cc.ancestor_id = :categoryId
  AND r.status = 'published';
```

ตัวอย่างแนวคิด count:

```sql
SELECT c.id, COUNT(r.id) AS report_count
FROM portal_categories c
JOIN portal_category_closure cc
  ON cc.ancestor_id = c.id
LEFT JOIN portal_dashboards r
  ON r.category_id = cc.descendant_id
  AND r.status = 'published'
GROUP BY c.id;
```

## Migration Plan

ลำดับที่แนะนำ:

1. เพิ่ม field taxonomy ที่จำเป็นใน `portal_categories`
2. เพิ่ม `portal_category_closure`
3. backfill closure จาก `portal_categories.parent_id`
4. ปรับ create/update category ให้ maintain closure table
5. ปรับ category count ให้นับรายงานใน subtree
6. ปรับ report query ให้สร้าง full category path ได้ ไม่จำกัดแค่ parent 1 ชั้น
7. เพิ่มหรือ map `visibility` จาก `sensitivity`
8. ปรับ seed data เป็นหมวดหมู่ด้านสาธารณสุข
9. ปรับหน้า public portal ให้เริ่มจาก category cards และนำทางลงหลายชั้น
10. ปรับคำใน UI จาก dashboard เป็น report ในส่วนที่ประชาชนหรือผู้ใช้งานเห็น

## Implementation Notes

สิ่งที่ควรระวัง:

- อย่า rename table จาก `portal_dashboards` เป็น `portal_reports` ทันทีถ้าจะทำให้ scope ใหญ่เกินไป
- ควรแยก public access rule ไว้ใน DB/API layer ไม่ใช่ filter เฉพาะ frontend
- category admin ที่มี scope บนหมวดแม่ควรจัดการหมวดย่อยและรายงานใต้หมวดนั้นได้
- count บน category ต้องนับแบบ subtree ไม่ใช่นับเฉพาะ report ที่ผูกกับ category นั้นโดยตรง
- breadcrumb ต้องรองรับความลึกมากกว่า 2 ชั้น
- หน้า public ไม่ควรใช้ภาษาว่า create dashboard หรือ dashboard competition

## Implementation Progress

- เพิ่ม full category path และ category ancestor ids ใน report query เพื่อรองรับหมวดหลายชั้น
- หน้า home และ catalog หลัง login ใช้ query ตามผู้ใช้ปัจจุบัน แทนการดึงรายงานทั้งหมดแล้วค่อยกรองบนหน้า
- กติกา permission ของ report ใช้ scope ของหมวดแม่ครอบคลุมรายงานในหมวดย่อยได้

## Suggested First Implementation Scope

รอบแรกควรทำเฉพาะแกนข้อมูลและ public navigation:

- DB migration สำหรับ taxonomy/closure
- seed หมวดหมู่ด้านสาธารณสุข
- helper query สำหรับ subtree, breadcrumb, report count
- ปรับ public page ให้แสดง category cards และ report list ตามหมวด
- คง embed viewer เดิมไว้ก่อน

สิ่งที่ยังไม่ควรทำในรอบแรก:

- full open data metadata
- downloadable dataset management
- API catalog
- complex many-to-many report/category mapping
- rename table ทั้งระบบจาก dashboard เป็น report หากยังไม่จำเป็น
