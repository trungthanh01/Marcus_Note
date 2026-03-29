---
title: Bài học System Design từ thực tế — Next.js + Supabase
description: Tổng hợp những nguyên tắc cốt lõi khi xây dựng full-stack app với Next.js và Supabase — từ cách phân chia trách nhiệm giữa các layer đến những cạm bẫy bảo mật ngoài đời thực.
date: 2026-03-29
tags: [system-design, nextjs, supabase, security, server-component, rls, architecture]
---

# Bài học System Design từ thực tế — Next.js + Supabase

> Lý thuyết nói "tách backend và frontend", nhưng thực tế ranh giới đó nằm ở đâu — và vi phạm nó trông như thế nào?

Bài này tổng hợp từ quá trình xây dựng thực tế, không phải tutorial. Mỗi phần đến từ một lỗi thật, một câu hỏi thật, hoặc một quyết định kiến trúc cần giải thích rõ.

---

## Phần 1 — Ba môi trường hoàn toàn tách biệt

Khi nhìn vào một full-stack app, có 3 nơi code chạy — và chúng **không chia sẻ bất cứ thứ gì** với nhau:

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER (máy của user)                                         │
│  Biết: UI state, input của user                                 │
│  Không biết: secret keys, DB, session thật                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP request / response
┌──────────────────────────▼──────────────────────────────────────┐
│  NEXT.JS SERVER (máy chủ)                                       │
│  Biết: secret keys, session cookie, business logic              │
│  Không biết: UI state của browser                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ SQL qua Supabase SDK
┌──────────────────────────▼──────────────────────────────────────┐
│  SUPABASE / POSTGRESQL (database server)                        │
│  Biết: data, auth.uid() của user hiện tại                       │
│  Không biết: HTTP, UI, business logic                           │
└─────────────────────────────────────────────────────────────────┘
```

**Bảng ai biết gì:**

| | Secret keys | Database | Session thật | UI state |
|---|---|---|---|---|
| **Browser** | KHÔNG | KHÔNG | Cookie (không đọc được) | CÓ |
| **Next.js Server** | CÓ | CÓ (qua SDK) | CÓ | KHÔNG |
| **Supabase DB** | KHÔNG | CÓ | Biết `auth.uid()` | KHÔNG |

**Nguyên tắc quan trọng nhất: Browser không được tin tưởng.**

```
Browser nói:  "Tao là user abc-123, cho tao xem data"
Server nghĩ: "Mày nói vậy thôi, tao phải kiểm tra cookie"
Database:    "Tao không quan tâm browser nói gì,
              tao chỉ tin auth.uid() từ session"
```

Mọi validate, auth check, query DB đều phải xảy ra ở server hoặc DB — không bao giờ ở browser — vì user có thể can thiệp vào mọi thứ chạy trên máy của họ.

---

## Phần 2 — Server Component vs Client Component: quy tắc chọn

Câu hỏi thực tế khi viết code: *file này nên là SC hay CC?*

```typescript
// Server Component (mặc định) — fetch data trực tiếp, không cần "use client"
export default async function ProductsPage() {
  const supabase = createClient()                           // server client
  const { data } = await supabase.from('products').select('*')
  return <ProductList products={data} />
}

// Client Component — chỉ khi thực sự cần
'use client'
export function AddToCartButton({ productId }: { productId: string }) {
  const addItem = useCartStore(s => s.addItem)              // Zustand hook
  return <button onClick={() => addItem(productId)}>Add</button>
}
```

**Quy tắc chọn:**

| Component cần gì | Dùng loại nào |
|---|---|
| Fetch data từ DB | SC |
| Chỉ render props/static | SC |
| `useState`, `useEffect` | CC |
| `onClick`, `onChange`, form handler | CC |
| Zustand store, custom hooks | CC |
| Browser API (`window`, `document`) | CC |

**Rule of thumb:** Default là SC. Chỉ thêm `'use client'` khi thực sự cần event handler, hook, hoặc browser API. Một component CC làm toàn bộ app chạy được, nhưng sẽ mất server-side rendering — initial HTML trống, user thấy spinner.

### Supabase client đúng theo từng môi trường

Một lỗi phổ biến là dùng nhầm Supabase client:

```typescript
// ✅ Client Component — dùng browser client
import { createClient } from '@/utils/supabase/client'

// ✅ Server Component / Server Action — dùng server client (đọc cookie)
import { createClient } from '@/utils/supabase/server'

// ⚠️ Admin client — bypass RLS, CHỈ dùng sau khi check auth đủ quyền
import { createAdminClient } from '@/utils/supabase/admin'

async function adminAction() {
  await requireAdminLevelServer()   // PHẢI check trước
  const supabase = createAdminClient()
}
```

Dùng browser client trong Server Component → không có session, mọi query trả về rỗng. Dùng admin client mà không check auth → bất kỳ user nào cũng bypass RLS.

---

## Phần 3 — Server Actions: mutations đúng cách

**Khi nào dùng Server Action, khi nào dùng API Route?**

- **Server Action** — form submit, click button, mọi mutation do user trigger trong app
- **API Route** — webhook từ Stripe, callback từ OAuth, endpoint cho external service gọi vào

```typescript
'use server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = createClient()

  // Luôn lấy user từ session server-side — không tin browser truyền user_id lên
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('profiles')
    .update({ name: formData.get('name') as string })
    .eq('id', user.id)

  revalidatePath('/profile')  // báo Next.js render lại trang với data mới
}
```

**Pattern quan trọng: `user_id` luôn lấy từ session, không bao giờ nhận từ browser.**

Nếu để client gửi `user_id` lên và server dùng thẳng, user có thể sửa request để update profile của người khác. Server phải tự đọc session để xác định user là ai.

### Form validation với React Hook Form + Zod

```typescript
const schema = z.object({
  name:  z.string().min(1, 'Bắt buộc'),
  email: z.string().email('Email không hợp lệ'),
})
type FormData = z.infer<typeof schema>

export function ContactForm() {
  const form = useForm<FormData>({ resolver: zodResolver(schema) })

  async function handleSubmit(data: FormData) {
    await updateProfile(data)  // gọi Server Action
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField name="name" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Tên</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </form>
    </Form>
  )
}
```

Zod validate ở client (instant feedback) + validate lại ở server action (defense-in-depth) — không tin tưởng chỉ một layer.

---

## Phần 4 — RLS: lớp bảo vệ cuối cùng và những cạm bẫy

RLS hoạt động như bộ lọc invisible trên mọi query. Khi policy bị vi phạm:

- **SELECT**: trả về 0 rows — **không có error**
- **UPDATE/DELETE**: 0 rows affected — **không có error**
- **INSERT**: throw permission denied

**Điểm nguy hiểm:** `data.length === 0` sau UPDATE không có nghĩa là row không tồn tại — có thể RLS đang block ngầm và bạn không biết.

### Cạm bẫy thực tế: policy tham chiếu cột đã bị xóa

```sql
-- Schema cũ: có 2 cột riêng
CREATE TABLE user_profiles (
  id      uuid DEFAULT gen_random_uuid(),  -- PK tự sinh
  user_id uuid NOT NULL,                   -- FK tới auth.users
  ...
);

-- Schema mới sau migration: id chính là auth user ID
CREATE TABLE user_profiles (
  id uuid NOT NULL,  -- id = auth.uid() trực tiếp, KHÔNG còn user_id
  ...
);
```

Nếu RLS policy cũ chưa được update:

```sql
-- Policy cũ — BROKEN vì user_id không còn tồn tại
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);  -- ❌ column user_id không tồn tại
```

PostgreSQL **không báo lỗi lúc tạo policy** — policy được lưu dưới dạng text. Lỗi chỉ xảy ra lúc evaluate và kết quả là policy luôn fail → block toàn bộ UPDATE ngầm. User không update được profile, server action trả về "không tìm thấy hồ sơ", nhưng thực ra row vẫn tồn tại.

**Fix:**

```sql
-- Drop policy cũ dùng user_id
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Tạo lại với tên cột đúng
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

```typescript
// Fix trong code: upsert thay vì update để tránh edge case
const { error } = await supabase
  .from('user_profiles')
  .upsert({ id: user.id, full_name }, { onConflict: 'id' })
```

### Cách verify RLS trước khi apply migration

Đừng đọc file migration cũ trong repo — nó có thể stale. Luôn dump trực tiếp từ production:

```bash
# Xem toàn bộ policies của một bảng từ production DB
supabase db dump --linked --schema public 2>&1 | grep -B2 -A8 'ON "public"."user_profiles"'

# Xem structure của bảng
supabase db dump --linked --schema public 2>&1 | grep -A15 'CREATE TABLE.*user_profiles'
```

Nếu output cho thấy `user_id` không có trong bảng nhưng policies vẫn dùng `user_id` → đây là root cause.

**Rule of thumb:**
1. Khi rename/drop cột, luôn audit tất cả RLS policies liên quan
2. `data.length === 0` sau UPDATE/DELETE ≠ row không tồn tại — có thể RLS block
3. `supabase db dump --linked` là source of truth — không phải file trong repo

---

## Phần 5 — Bảo mật ở Frontend: những lỗi hay gặp

### XSS trên SSR: không bao giờ skip sanitize

```typescript
// SAI — bỏ qua sanitize ở SSR với lý do "data từ DB tin cậy"
function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return html  // SSR: skip ← LỖI
  return DOMPurify.sanitize(html, config)
}

// ĐÚNG — isomorphic-dompurify chạy được cả server lẫn client
import DOMPurify from 'isomorphic-dompurify'

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, config)  // luôn sanitize
}
```

DB không phải "trusted boundary" — content trong DB có thể đã bị inject từ trước, hoặc từ admin form. Sanitize là defense-in-depth, không phải optional.

### Nested `<Link>` gây hydration error

```tsx
// SAI — PostCard đã có <Link> bao ngoài, CategoryBadge thêm <Link> nữa
export function CategoryBadge({ categorySlug }) {
  return (
    <Link href={`/blog/${categorySlug}`}>  {/* <a> lồng trong <a>! */}
      <Badge>...</Badge>
    </Link>
  )
}

// ĐÚNG — dùng useRouter + stopPropagation
'use client'
export function CategoryBadge({ categorySlug }) {
  const router = useRouter()
  return (
    <Badge onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()   // chặn bubble lên Link cha
      router.push(`/blog/${categorySlug}`)
    }}>
      ...
    </Badge>
  )
}
```

HTML không cho phép `<a>` lồng `<a>`. React hydration fail vì server render khác client render khi browser tự sửa DOM.

### Tailwind custom color ghi đè built-in

```javascript
// SAI — ghi đè canonical white, toàn bộ bg-white trong app thành màu kem
theme: {
  extend: {
    colors: { white: '#F9F6F1' }   // ← override Tailwind built-in!
  }
}

// ĐÚNG — đặt tên riêng, không xung đột
colors: { 'warm-white': '#F9F6F1' }
```

Sau đó dùng semantic tokens thay vì hardcode:

```tsx
// Sai:  className="bg-white text-black"
// Đúng: className="bg-background text-foreground"
// Sai:  className="bg-white" (card)
// Đúng: className="bg-card"
```

Semantic tokens hỗ trợ dark mode tự động, không cần viết lại component.

---

## Kết luận

- **Ba môi trường** (Browser / Server / DB) không chia sẻ gì với nhau — browser là untrusted, mọi logic quan trọng nằm ở server và DB
- **SC là default**, chỉ thêm `'use client'` khi cần interactivity — sai chỗ là mất SSR
- **Server Action** cho mutations, **user_id luôn lấy từ session** không tin browser
- **RLS block ngầm không có error** — `data.length === 0` sau UPDATE ≠ row không tồn tại; khi rename cột nhớ audit tất cả policies
- **`supabase db dump --linked`** là source of truth duy nhất về schema thực tế của production
- **Sanitize HTML luôn luôn**, kể cả SSR; không bao giờ skip vì "data từ DB tin cậy"

---

## Liên kết
<!-- published from /publish 2026-03-29 -->
<!-- source notes: 13_browser-vs-server, 09_lekhavn-architecture, 12_supabase-rls-fix, 11_supabase-db-dump, 08_code-review-xss -->

- [[01_Design System with Todo List]] — ứng dụng các nguyên tắc này vào todo app cụ thể
- [[02_System Design Document — Todo List App]] — SDD đầy đủ theo chuẩn chuyên nghiệp
- [[01_Supabase auth và Next.js]] — auth flow chi tiết với Supabase
