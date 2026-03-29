---
title: Design System với Todo List — Học qua thực hành
description: Giải thích từng block trong hệ thống full-stack todo app theo cách dễ hiểu nhất — Browser, Next.js Server, và Supabase hoạt động như thế nào.
date: 2026-03-27
tags: [system-design, nextjs, supabase, browser, server-component, client-component]
---

# Design System với Todo List

Đây là dự án đầu tiên mình bắt tay vào học design system. Mình vốn dĩ chẳng thể hiểu được cái tên — dịch ra tiếng Việt là "thiết kế hệ thống", nhưng hệ thống gồm những gì? Thiết kế như thế nào?

Thử tưởng tượng: trên browser là những gì chúng ta thấy về một todo list — từ lúc vào phải `/login`, rồi app xuất hiện với các tính năng như thêm todo, check boxes, thêm note. Những thứ này xuất hiện không phải vì mình viết HTML và JavaScript thủ công, mà thực chất là render từ phía back end và database.

Thay vì ngồi đoán mò, mình dùng Claude Code để học luôn — yêu cầu nó tạo ra System Design Document (SDD) theo tiêu chuẩn dev chuyên nghiệp, rồi vẽ ra dạng diagram cho dễ hình dung.

---

## 1. High-Level Architecture

> Bắt đầu với câu hỏi: Hệ thống gồm những khối nào?

![[Pasted image 20260327212755.png]]

Có tổng cộng 3 blocks: **Browser**, **Next.js Server**, **Supabase**.

Thứ chúng ta nhìn thấy đầu tiên khi mở app là Browser. Đằng sau sự mượt mà đó là Next.js Server xử lý logic. Cuối cùng là Supabase — nơi lưu trữ toàn bộ data: id user, content, security...

---

### Block 1: Browser

Ở khối này có 3 thứ:

- **React UI** — bao gồm màu sắc, hình ảnh, layout
  - **SC (Server Component)** — component chạy trên server, render ra HTML rồi gửi về browser. Browser nhận HTML tĩnh, không nhận JS của component này.
  - **CC (Client Component)** — component chạy trên browser, xử lý mọi tương tác của user như click, gõ phím, submit form.

#### Vậy [[04_Server Component]] (SC) là gì?

SC **chính là** back end — nó chạy trên máy chủ, không phải trên browser của user.

Chúng ta sẽ tạo ra một page gọi là `app/(auth)/todo/page.tsx`. Ở đây không đặt `"use client"` vì mặc định là Server Component.

```typescript
export default async function TodosPage() {
  const todos = await getTodosFromDB()  // ✅ gọi DB trực tiếp được
  return <TodoList todos={todos} />
}
```

**Đặc điểm:**
- Chạy trên server — có thể gọi DB trực tiếp, đọc file, dùng secret key.
- Không dùng được `useState`, `onClick`, `useEffect`.
- Browser không nhận JS của component này → trang load nhanh hơn.
- Render ra HTML và gửi về browser — user thấy nội dung ngay, không có spinner.

#### Vậy [[03_Client Component]] (CC) là gì?

File có dạng `features/todo/components/TodoCard.tsx`. Bắt buộc khai báo `"use client"` ở dòng đầu tiên.

```typescript
"use client"

export default function TodoCard({ todo }) {
  const [isDone, setIsDone] = useState(todo.is_done)  // ✅ dùng được state
  return (
    <input
      type="checkbox"
      checked={isDone}
      onChange={() => setIsDone(!isDone)}  // ✅ event handler được
    />
  )
}
```

**Đặc điểm:**
- Chạy trên browser.
- Dùng được `useState`, `useEffect`, `onClick`, form inputs.
- Không thể gọi DB trực tiếp.
- Browser nhận JS của component này để chạy.

#### Browser hoạt động thế nào?

Browser hiển thị cả SC lẫn CC — sự khác biệt không phải là *cái gì hiển thị* mà là *ai render*.

**Khi gõ `/todos` lên thanh địa chỉ**, browser gửi HTTP GET request lên Next.js server:

```
Browser  ──── GET /todos ────►  Next.js Server
```

Server nhận request, chạy SC, gọi DB lấy danh sách todos, render ra HTML hoàn chỉnh rồi trả về:

```
Browser  ◄─── HTML (đã có todos bên trong) ────  Next.js Server
```

Browser nhận HTML và hiển thị ngay — **không cần thêm bước nào nữa**, không có spinner chờ data.

---

**Khi click checkbox "done"**, không có HTTP GET nào cả. CC gửi một **Server Action** — gọi một function trên server:

```
Browser  ──── toggleTodoDone({ id, is_done: true }) ────►  Next.js Server
                                                                   │
                                                            UPDATE todos SET
                                                            is_done = true
                                                                   │
                                                            ◄── success ────
```

Checkbox tự flip ngay lập tức (optimistic UI) mà không cần chờ server trả lời — nếu server báo lỗi thì mới revert lại.

---

**Tóm lại browser làm 2 việc:**

| Việc | Loại request | Ai xử lý |
|------|-------------|----------|
| Mở trang, load data | HTTP GET | SC trên server render HTML |
| Click, submit form, CRUD | Server Action | CC gọi function trên server |

Điểm quan trọng nhất: **browser không được tin tưởng**. Mọi validate, auth check, query DB đều phải xảy ra ở server hoặc database — không bao giờ ở browser — vì user có thể can thiệp vào mọi thứ chạy trên máy của họ.

---

### Block 2: Next.js Server

![[Pasted image 20260327212755.png]]

Next.js Server là **trung gian** giữa Browser và Supabase — nó không lưu data, không hiển thị UI, nhưng mọi thứ đều phải đi qua nó.

Hãy hình dung: Browser là khách hàng, Supabase là kho hàng, Next.js Server là nhân viên đứng giữa. Khách không được vào kho trực tiếp — mọi yêu cầu đều phải qua nhân viên, nhân viên kiểm tra quyền rồi mới lấy hàng ra.

#### Bên trong Next.js Server có 3 thứ:

- **Middleware** — chạy *trước mọi request*, làm nhiệm vụ bảo vệ cửa
- **Server Actions** — các function xử lý mutations (tạo, sửa, xóa data)
- **Server Components** — render HTML từ data lấy ở DB

#### Middleware là gì?

[[02_Middleware]] chạy **trước khi bất kỳ trang nào được render**. Mỗi lần browser gửi request, middleware chặn lại và kiểm tra trước.

Trong todo app, middleware làm một việc duy nhất: *mày có đang đăng nhập không?*

```
Browser gõ /todos
       │
       ▼
  Middleware  ──── có session cookie? ────► KHÔNG → redirect /login
       │
      CÓ
       │
       ▼
  Tiếp tục render trang
```

```typescript
// middleware.ts — chạy trên MỌI request
export async function middleware(request: NextRequest) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

#### Server Actions là gì?

Server Actions là các **TypeScript function chạy trên server**, được CC gọi trực tiếp khi user thao tác như tạo todo, xóa todo, tick checkbox.

> Tìm hiểu thêm: [[05_Server Action vs API Routes]]

CC gọi Server Action như gọi function bình thường trong code, nhưng thực tế function đó chạy trên server — browser không thấy code bên trong, không thấy DB credentials, không thấy logic xử lý.

```typescript
// features/todos/actions.ts
"use server"

export async function createTodo(title: string) {
  const supabase = await createServerClient()     // tạo client dùng cookie

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Chưa đăng nhập" } // kiểm tra auth

  // user_id lấy từ session, không tin browser
  const { data } = await supabase
    .from("todos")
    .insert({ title, user_id: user.id })

  revalidatePath("/todos")                        // báo Next.js render lại trang
  return { success: true, data }
}
```

**Toàn bộ 5 Server Actions trong todo app:**

| Action | Browser gửi gì | Server làm gì | Supabase nhận gì |
|--------|---------------|---------------|-----------------|
| `createTodo` | title, due_at | validate + lấy user_id | INSERT |
| `updateTodoTitle` | id, title mới | kiểm tra ownership | UPDATE title |
| `toggleTodoDone` | id, trạng thái | kiểm tra ownership | UPDATE is_done |
| `updateTodoDueDate` | id, ngày mới | kiểm tra ownership | UPDATE due_at |
| `deleteTodo` | id | kiểm tra ownership | DELETE |

#### Mối quan hệ với Browser

```
Browser (CC)                    Next.js Server
     │                               │
     │  1. user click "Add Todo"     │
     │──── createTodo("Học React") ─►│
     │                               │  2. kiểm tra session
     │                               │  3. validate input
     │                               │  4. gửi INSERT → Supabase
     │                               │  5. revalidatePath
     │◄─── { success: true } ────────│
     │                               │
     │  6. Next.js tự render lại     │
     │     trang /todos với data mới │
```

Browser **không bao giờ nói chuyện trực tiếp với Supabase** — mọi thứ đều qua Next.js Server. Đây là lý do DB credentials chỉ tồn tại trên server, không bao giờ lộ ra browser.

#### Mối quan hệ với Supabase

Next.js Server dùng **Supabase JS SDK** để nói chuyện với DB. Có 2 loại client:

- `createServerClient()` — dùng trong Server Actions và Server Components, đọc session từ cookie
- `createBrowserClient()` — dùng trong Client Components, đọc session từ bộ nhớ browser

```
Next.js Server ──── SQL qua HTTPS ────► Supabase
                                              │
                                        RLS kiểm tra:
                                        user_id = auth.uid()?
                                              │
                                        CÓ → trả data
                                        KHÔNG → trả rỗng
```

#### Tóm lại Next.js Server làm 3 việc:

| Thành phần | Chạy khi nào | Làm gì |
|------------|-------------|--------|
| **Middleware** | Trước mọi request | Kiểm tra session, redirect nếu chưa login |
| **Server Component** | Browser gửi GET request | Lấy data từ DB, render HTML, trả về browser |
| **Server Action** | CC gọi khi user thao tác | Validate, xác thực user, thực thi query DB |

---

### Block 3: Supabase

![[Pasted image 20260329124437.png]]
![[Pasted image 20260327212755.png]]

Supabase là **nơi cuối cùng data được lưu trữ** — không biết gì về UI, không biết gì về HTTP request, chỉ biết một việc: nhận SQL query, kiểm tra quyền, trả về data.

Hãy hình dung Supabase như một két sắt thông minh. Next.js Server là người giữ chìa khóa, nhưng két sắt có cơ chế tự bảo vệ riêng — dù người giữ chìa khóa sai sót, két vẫn tự từ chối nếu không đúng quy tắc.

Supabase gồm 2 phần chính:

- **PostgreSQL Database** — nơi lưu bảng `todos` và `auth.users`
- **RLS (Row Level Security)** — cơ chế bảo vệ từng dòng data ngay tại tầng database

#### Supabase lưu data như thế nào?

Toàn bộ data nằm trong **một bảng duy nhất**: `todos`.

```
Bảng todos
┌──────────────────────────────────────────────────────────────────┐
│ id          │ user_id      │ title        │ is_done │ due_at     │
├─────────────┼──────────────┼──────────────┼─────────┼────────────┤
│ uuid-001    │ uuid-userA   │ Học React    │ false   │ 2026-04-01 │
│ uuid-002    │ uuid-userA   │ Làm bài tập  │ true    │ null       │
│ uuid-003    │ uuid-userB   │ Mua sữa      │ false   │ 2026-03-30 │
│ uuid-004    │ uuid-userB   │ Gọi cho mẹ   │ false   │ null       │
└──────────────────────────────────────────────────────────────────┘
```

Todos của mọi user nằm chung một bảng. Cột `user_id` là thứ phân biệt todo của ai — đây là lý do RLS quan trọng đến vậy.

**Tại sao dùng `uuid` thay vì số thứ tự 1, 2, 3?**

Nếu dùng số thứ tự, user có thể đoán: "Todo của tao là id=5, thử id=6 xem có lấy được todo của người khác không?" UUID trông như `a3f8c1d2-4b5e-...` — không thể đoán được.

#### RLS là gì và tại sao cần nó?

RLS — Row Level Security — là tính năng của PostgreSQL cho phép **mỗi dòng trong bảng tự biết ai được phép đọc/ghi nó**.

> Tìm hiểu thêm: [[06_RLS To Protect User]] · [[08_sử dụng auth.uid() trong chính sách RLS]] · [[07_Authentication]] · [[09_Supabase Auth và mối quan hệ với các tác nhân xung quanh]]

Không có RLS, nếu Next.js Server vô tình gửi query thiếu điều kiện:

```sql
SELECT * FROM todos  -- quên WHERE user_id = ?
```

Supabase trả về todos của **tất cả mọi người** — data leak.

Với RLS bật, dù query thiếu điều kiện, Supabase tự động enforce:

```sql
SELECT * FROM todos
WHERE user_id = auth.uid()  -- Supabase tự thêm vào, server không cần nhớ
```

**4 policy cho bảng todos:**

```sql
CREATE POLICY "own_todos_select" ON todos
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "own_todos_insert" ON todos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own_todos_update" ON todos
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "own_todos_delete" ON todos
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
```

`auth.uid()` đọc JWT token trong request và trả về ID của user đang đăng nhập — DB tự biết đang phục vụ ai mà không cần server nói.

#### Luồng xử lý data

**Khi server gửi query lấy todos:**

```
Next.js Server                    Supabase
     │                                │
     │── SELECT * FROM todos ────────►│
     │                                │ 1. Nhận query
     │                                │ 2. Đọc JWT → lấy auth.uid()
     │                                │ 3. RLS filter: user_id = auth.uid()
     │                                │ 4. Chỉ trả rows đúng user
     │◄── [todos của user đó thôi] ───│
```

**Khi server gửi query INSERT todo mới:**

```
Next.js Server                    Supabase
     │                                │
     │── INSERT INTO todos            │
     │   (user_id, title, ...) ──────►│
     │                                │ 1. RLS check: user_id = auth.uid()?
     │                                │    ĐÚNG → cho INSERT
     │                                │    SAI  → từ chối, trả lỗi
     │◄── { id: "uuid-mới", ... } ────│
```

#### auth.users — bảng Supabase tự quản lý

```
auth.users (Supabase quản lý)      todos (mình tạo)
┌─────────────────────┐            ┌──────────────────────────┐
│ id       uuid  PK   │◄───────────│ user_id  uuid  FK        │
│ email    text       │   1 ─── N  │ title    text            │
│ ...                 │            │ is_done  boolean         │
└─────────────────────┘            └──────────────────────────┘
```

Khi user đăng ký, Supabase tự tạo row trong `auth.users` và cấp JWT. Mình chỉ cần lưu `user_id` trong bảng `todos` là đủ — không cần tự build hệ thống auth.

#### Tóm lại Supabase làm 2 việc:

| Thành phần | Nhiệm vụ | Kích hoạt khi nào |
|------------|----------|-------------------|
| **PostgreSQL DB** | Lưu và trả data | Mỗi khi Server Action gửi query |
| **RLS Policies** | Lọc data theo user — tự động | Mỗi query đến DB |

Supabase là lớp bảo vệ cuối cùng — dù Middleware hay Server Action có bug, Supabase vẫn không bao giờ trả data sai người.

---

## Liên kết

- [[02_System Design Document — Todo List App]] — SDD đầy đủ theo chuẩn chuyên nghiệp
- [[02_Middleware]] — Middleware hoạt động chi tiết
- [[03_Client Component]] — Client Component chi tiết
- [[04_Server Component]] — Server Component chi tiết
- [[05_Server Action vs API Routes]] — khi nào dùng cái nào
- [[06_RLS To Protect User]] — RLS policies chi tiết
- [[07_Authentication]] — hệ thống auth của Supabase
