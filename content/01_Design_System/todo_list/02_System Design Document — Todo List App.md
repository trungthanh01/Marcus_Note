---
title: System Design Document — Todo List App
description: Tài liệu thiết kế hệ thống đầy đủ cho todo list app, bao gồm database schema, API design, frontend architecture và security model.
date: 2026-03-27
tags: [system-design, nextjs, supabase, typescript, architecture]
---

# System Design Document — Todo List App

**Version:** 1.0 · **Date:** 2026-03-27 · **Stack:** Next.js 15 · TypeScript · Supabase · Tailwind CSS · shadcn/ui

---

## Table of Contents

1. [Overview](#1-overview)
2. [Requirements](#2-requirements)
3. [Architecture Overview](#3-architecture-overview)
4. [Database Design](#4-database-design)
5. [API Design](#5-api-design)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Security Model](#7-security-model)
8. [Data Flow Diagrams](#8-data-flow-diagrams)
9. [File Structure](#9-file-structure)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Trade-offs & Decisions](#11-trade-offs--decisions)

---

## 1. Overview

### 1.1 Problem Statement

Users need a simple, reliable way to manage personal tasks with due dates. The app must work across devices and persist data between sessions.

### 1.2 Goals

| Goal | Description |
|------|-------------|
| Functional | Full CRUD for todos (create, read, update, delete) |
| Secure | Each user sees only their own data |
| Usable | Inline editing, checkbox toggle, date picker |
| Simple | No unnecessary complexity — learning-focused codebase |

### 1.3 Non-Goals (Out of Scope)

- Sharing todos with other users
- Notifications / reminders
- Mobile native app
- Deployment to production (local only)
- Real-time collaboration

---

## 2. Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| F-01 | User can register and log in with email/password | Must |
| F-02 | User can create a todo with title and optional due date | Must |
| F-03 | User can view all their todos in a list | Must |
| F-04 | User can mark a todo as done / undone via checkbox | Must |
| F-05 | User can edit todo title inline | Must |
| F-06 | User can set or change the due date | Must |
| F-07 | User can delete a todo | Must |
| F-08 | Overdue todos show a visual indicator | Should |
| F-09 | Todos sorted: undone first, then by due date ascending | Should |

### 2.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NF-01 | Page load shows content without a loading spinner | < 200ms (server-rendered) |
| NF-02 | Checkbox toggle feels instant | Optimistic UI, < 16ms visual response |
| NF-03 | Data is secure per-user | RLS enforced at DB level |
| NF-04 | Codebase is understandable by a junior dev | Clear naming, minimal abstraction |

### 2.3 Actors & Permissions

| Actor | Can Do |
|-------|--------|
| **Guest** (not logged in) | Access `/login` only. All other routes redirect to `/login` |
| **Authenticated User** | Full CRUD on their own todos only |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                           BROWSER                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Next.js (React)                      │   │
│  │  Server Components            Client Components          │   │
│  │  ─────────────────            ────────────────           │   │
│  │  TodosPage                    TodoCard (checkbox, edit)  │   │
│  │  TodoList                     AddTodoForm                │   │
│  │                               LoginForm                  │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │ Server Actions (RPC over HTTP)         │
└─────────────────────────┼───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                     NEXT.JS SERVER (Node.js)                    │
│  Server Actions                   Middleware                    │
│  ─────────────                    ──────────                    │
│  createTodo()                     Session check                 │
│  updateTodoTitle()                Auth guard redirect           │
│  toggleTodoDone()                 Cookie refresh                │
│  updateTodoDueDate()                                            │
│  deleteTodo()                                                   │
│  login() / logout()                                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Supabase JS SDK (PostgreSQL)
┌─────────────────────────▼───────────────────────────────────────┐
│                          SUPABASE                               │
│  ┌─────────────────────┐     ┌────────────────────────────┐    │
│  │     auth.users      │◄────│           todos            │    │
│  │   (managed by       │     │  id, user_id, title,       │    │
│  │    Supabase)        │     │  is_done, due_at, ...      │    │
│  └─────────────────────┘     └────────────────────────────┘    │
│                                        ▲                        │
│                                 RLS Policies                    │
│                           (user sees only their rows)           │
└─────────────────────────────────────────────────────────────────┘
```

### 3.1 Why this architecture?

| Decision | Reason |
|----------|--------|
| Next.js App Router | Server Components = HTML pre-rendered on server, no spinner on load |
| Server Actions | Type-safe mutations without writing REST API boilerplate |
| Supabase | PostgreSQL + Auth + RLS in one managed service |
| No separate backend | For a single-user CRUD app, a dedicated API server is unnecessary complexity |

---

## 4. Database Design

### 4.1 Entity-Relationship Diagram

```
auth.users (Supabase managed)        todos (our table)
─────────────────────────────        ──────────────────────────────────
id          uuid  PK                 id          uuid  PK
email       text                     user_id     uuid  FK → auth.users.id
created_at  timestamptz              title       text
                         1 ──── N    is_done     boolean
                                     due_at      timestamptz  (nullable)
                                     updated_at  timestamptz
                                     created_at  timestamptz
```

### 4.2 Table: `todos`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key, unpredictable |
| `user_id` | `uuid` | NO | — | FK to `auth.users.id`, identifies owner |
| `title` | `text` | NO | `''` | Todo content, no length limit at DB level |
| `is_done` | `boolean` | NO | `false` | Completion state |
| `due_at` | `timestamptz` | YES | `null` | Optional deadline, timezone-aware |
| `updated_at` | `timestamptz` | NO | `now()` | Last modification time |
| `created_at` | `timestamptz` | NO | `now()` | Creation time, immutable |

### 4.3 SQL Migration

```sql
-- ================================================================
-- Migration: 001_create_todos
-- Purpose: Create the todos table with indexes and RLS
-- ================================================================

CREATE TABLE todos (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text        NOT NULL DEFAULT '',
  is_done    boolean     NOT NULL DEFAULT false,
  due_at     timestamptz,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Index on user_id: every query filters by this column
-- Without this, each page load does a full table scan
CREATE INDEX idx_todos_user_id ON todos(user_id);

-- Composite index: covers "user X's todos sorted by due_at"
CREATE INDEX idx_todos_user_id_due_at ON todos(user_id, due_at);
```

### 4.4 Design Decisions

| Decision | Alternative | Why We Chose This |
|----------|-------------|-------------------|
| `uuid` PK | `SERIAL` integer | UUIDs are unpredictable — user cannot guess others' todo IDs |
| `timestamptz` | `timestamp` | Stores UTC, converts to user's local timezone |
| `boolean` for `is_done` | `status ENUM` | Only 2 states exist. ENUM adds migration complexity for no benefit |
| `title TEXT` | `VARCHAR(255)` | Identical storage in Postgres. Enforce length in app code, not DB type |
| Hard delete | Soft delete (`deleted_at`) | Todos are ephemeral. Soft delete adds `WHERE deleted_at IS NULL` to every query for no benefit |

---

## 5. API Design

### 5.1 Server Actions vs API Routes

```
Server Actions  →  mutations triggered by user interaction in the UI
API Routes      →  webhooks, third-party callbacks, external consumers
```

### 5.2 Auth Actions (`features/auth/actions.ts`)

```
login
  Input:   { email: string, password: string }
  Output:  { success: boolean, error?: string }
  Auth:    No (this is the auth step)
  Effect:  Sets session cookie via Supabase → redirect('/todos')

logout
  Input:   none
  Output:  void
  Auth:    Yes
  Effect:  Clears session cookie → redirect('/login')
```

### 5.3 Todo Actions (`features/todos/actions.ts`)

```
createTodo
  Input:    { title: string, due_at?: string }
  Output:   { success: boolean, data?: Todo, error?: string }
  Auth:     Yes — reads user_id from server session
  RLS:      INSERT policy enforces user_id = auth.uid()
  Validate: title.trim() !== '', due_at is valid ISO 8601 if provided
  Effect:   INSERT into todos, revalidatePath('/todos')

updateTodoTitle
  Input:    { id: string, title: string }
  Output:   { success: boolean, error?: string }
  Auth:     Yes
  RLS:      UPDATE policy — wrong user → 0 rows affected
  Validate: title.trim() !== ''
  Effect:   UPDATE todos SET title, updated_at = now()

toggleTodoDone
  Input:    { id: string, is_done: boolean }
  Output:   { success: boolean, error?: string }
  Auth:     Yes
  RLS:      UPDATE policy
  Effect:   UPDATE todos SET is_done, updated_at = now()

updateTodoDueDate
  Input:    { id: string, due_at: string | null }
  Output:   { success: boolean, error?: string }
  Auth:     Yes
  RLS:      UPDATE policy
  Effect:   UPDATE todos SET due_at, updated_at = now()

deleteTodo
  Input:    { id: string }
  Output:   { success: boolean, error?: string }
  Auth:     Yes
  RLS:      DELETE policy — user cannot delete others' todos
  Effect:   DELETE FROM todos WHERE id = $1
```

### 5.4 API Routes

```
GET /api/auth/callback
  Purpose:   Required by Supabase to complete email confirmation flow
  Triggered: By Supabase after user clicks confirmation email link
  Logic:     Exchange code → session → set cookie → redirect('/todos')
```

---

## 6. Frontend Architecture

### 6.1 Route Structure

```
app/
├── layout.tsx                    # Root layout (fonts, globals.css)
├── globals.css                   # Design tokens (CSS variables)
├── login/
│   └── page.tsx                  # PUBLIC — email/password form
├── (auth)/                       # PROTECTED route group
│   ├── layout.tsx                # Auth guard: no session → redirect /login
│   └── todos/
│       ├── page.tsx              # Main todo list (Server Component)
│       └── loading.tsx           # Skeleton shown during page load
└── api/
    └── auth/
        └── callback/
            └── route.ts          # Supabase auth callback
```

### 6.2 Component Tree

```
TodosPage                         [SERVER COMPONENT]
│  Fetches todos from DB on the server.
│  Renders HTML before sending to browser — no spinner.
│
├── AddTodoForm                   [CLIENT COMPONENT]
│   │  Needs useState for controlled inputs (title, due_at).
│   ├── <Input />                 [UI — shadcn/ui]
│   ├── <DateTimePicker />        [UI — custom wrapper]
│   └── <Button />                [UI — shadcn/ui]
│
└── TodoList                      [SERVER COMPONENT]
    │  Pure rendering — maps todos array to TodoCards.
    └── TodoCard (×N)             [CLIENT COMPONENT]
        │  useState: optimistic is_done toggle + inline title editing
        ├── <Checkbox />          [UI — shadcn/ui]
        ├── <Input />             [UI — shadcn/ui, inline edit]
        ├── <DateTimePicker />    [UI — reused]
        └── <Button />            [UI — delete icon]
```

### 6.3 Server Component vs Client Component

| Component | SC / CC | Reason |
|-----------|---------|--------|
| `TodosPage` | **SC** | Only fetches data, no interactivity |
| `TodoList` | **SC** | Only maps props to children, no state |
| `TodoCard` | **CC** | Checkbox toggle + inline edit → needs `useState` + event handlers |
| `AddTodoForm` | **CC** | Controlled inputs → needs `useState` |
| `LoginPage` | **CC** | Form with state (email, password values) |

**Rule:** Push the SC/CC boundary as deep as possible. Less JS in the browser = faster initial load.

### 6.4 State Management

| State | Type | Where | Reason |
|-------|------|-------|--------|
| List of todos | Server state | Fetched in `TodosPage` (SC) | Re-fetch on mutation via `revalidatePath` |
| `is_done` while toggling | Client state | `useState` in `TodoCard` | Optimistic UI — checkbox must feel instant |
| Title while editing | Client state | `useState` in `TodoCard` | Tracks value as user types |
| New todo form values | Client state | `useState` in `AddTodoForm` | Controlled inputs |
| Auth session | Server state | Supabase cookie | No Zustand needed |

---

## 7. Security Model

### 7.1 Layers of Defense

```
Request comes in
       │
       ▼
┌─────────────────────────────────────────┐
│  Layer 1: Next.js Middleware            │
│  Checks session cookie.                 │
│  No session → redirect to /login.       │
│  Runs on EVERY request.                 │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│  Layer 2: Server Action auth check      │
│  const { data: { user } } =             │
│    await supabase.auth.getUser()        │
│  No user → return { error: 'Unauth' }  │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│  Layer 3: Supabase RLS                  │
│  DB itself checks user_id = auth.uid()  │
│  Even if layers 1+2 have a bug,         │
│  the DB returns 0 rows.                 │
└─────────────────────────────────────────┘
```

### 7.2 RLS Policies

```sql
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_todos_select" ON todos
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "own_todos_insert" ON todos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own_todos_update" ON todos
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own_todos_delete" ON todos
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
```

---

## 8. Data Flow Diagrams

### 8.1 Page Load (Read)

```
Browser              Next.js Server            Supabase DB
   │                       │                        │
   │── GET /todos ─────────►│                        │
   │                       │── SELECT * FROM todos ─►│
   │                       │   WHERE user_id =        │
   │                       │   auth.uid()             │── RLS check
   │                       │◄── rows returned ────────│
   │                       │  Render HTML with data   │
   │◄── HTML (with todos) ─│                        │
   │                       │                        │
   User sees list immediately. No loading spinner.
```

### 8.2 Toggle Checkbox (Optimistic UI)

```
Browser (TodoCard)     Next.js Server          Supabase DB
       │                     │                      │
       │  user clicks ✓      │                      │
       ├── setIsDone(true) → UI flips instantly      │
       │                     │                      │
       │── toggleTodoDone() ─►│                      │
       │                     │── UPDATE todos SET ──►│
       │                     │   is_done = true      │
       │                     │◄── success ───────────│
       │◄── revalidatePath ──│                      │
       │                     │                      │
       │  [If error: revert checkbox + show toast]
```

### 8.3 Create Todo

```
Browser (AddTodoForm)  Next.js Server          Supabase DB
       │                     │                      │
       │  user submits form   │                      │
       │── createTodo({      │                      │
       │    title, due_at    │                      │
       │  }) ────────────────►│                      │
       │                     │  Validate input       │
       │                     │  Get user from session│
       │                     │── INSERT INTO todos ──►│
       │                     │◄── new row ───────────│
       │                     │  revalidatePath       │
       │◄── page re-renders ─│                      │
       │  Form resets, new todo appears in list
```

---

## 9. File Structure

```
todo-list/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── (auth)/
│   │   ├── layout.tsx               # Auth guard
│   │   └── todos/
│   │       ├── page.tsx             # TodosPage (SC)
│   │       └── loading.tsx
│   └── api/
│       └── auth/
│           └── callback/
│               └── route.ts
├── features/
│   ├── todos/
│   │   ├── actions.ts
│   │   ├── types.ts
│   │   └── components/
│   │       ├── TodoList.tsx         # SC
│   │       ├── TodoCard.tsx         # CC
│   │       └── AddTodoForm.tsx      # CC
│   └── auth/
│       ├── actions.ts
│       └── components/
│           └── LoginForm.tsx        # CC
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── checkbox.tsx
│       └── date-time-picker.tsx
├── lib/
│   └── supabase/
│       ├── client.ts                # Browser client
│       └── server.ts                # Server client (cookies)
├── middleware.ts
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 10. Implementation Roadmap

```
MILESTONE 1 — Foundation
  Goal: project runs, connects to DB, nothing user-facing yet
  [ ] npx create-next-app@latest --typescript --tailwind --app
  [ ] npm install @supabase/supabase-js @supabase/ssr
  [ ] Create Supabase local project (supabase start)
  [ ] Run migration: 001_create_todos.sql
  [ ] Apply RLS policies
  [ ] Create lib/supabase/client.ts + server.ts
  [ ] Create middleware.ts (session refresh)
  ✓ Check: server action can INSERT and SELECT from todos

MILESTONE 2 — Authentication
  Goal: login/logout works, protected routes redirect correctly
  [ ] app/login/page.tsx + LoginForm.tsx
  [ ] features/auth/actions.ts (login, logout)
  [ ] app/(auth)/layout.tsx (auth guard)
  [ ] app/api/auth/callback/route.ts
  ✓ Check: login → /todos, refresh keeps session, logout → /login

MILESTONE 3 — Core CRUD
  Goal: can create, view, toggle, delete todos end-to-end
  [ ] features/todos/actions.ts (createTodo, deleteTodo, toggleTodoDone)
  [ ] app/(auth)/todos/page.tsx (fetches todos server-side)
  [ ] TodoList.tsx + TodoCard.tsx (checkbox + delete button)
  [ ] AddTodoForm.tsx (title input + submit)
  ✓ Check: create → appears in list, toggle → persists on refresh, delete → gone

MILESTONE 4 — Inline Editing + Due Date
  Goal: full editing experience
  [ ] Inline title edit in TodoCard (click → input → blur saves)
  [ ] DateTimePicker component
  [ ] updateTodoTitle + updateTodoDueDate actions
  [ ] Due date display, overdue indicator (red if due_at < now())
  ✓ Check: edit title, set/clear due date, overdue state shows correctly

MILESTONE 5 — Polish
  Goal: production-quality UX
  [ ] loading.tsx skeleton for todos page
  [ ] Empty state when no todos ("Add your first todo ↑")
  [ ] Sort: undone first, then by due_at ASC
  [ ] Optimistic revert on error + toast notification
  [ ] Responsive layout (mobile-friendly)
```

---

## 11. Trade-offs & Decisions

| Decision | What We Chose | What We Rejected | Why |
|----------|--------------|-----------------|-----|
| Mutations | Server Actions | REST API routes | Type-safe, less boilerplate, no separate API layer |
| Real-time | `revalidatePath` on mutation | Supabase Realtime | WebSocket complexity not needed for single-user app |
| Global state | None (no Zustand) | Zustand / Redux | No cross-component shared state exists |
| Delete | Hard delete | Soft delete (`deleted_at`) | Todos are ephemeral, soft delete adds query complexity for no benefit |
| Auth | Supabase email/password | NextAuth.js | Already included in Supabase, fewer dependencies |
| Styling | Tailwind + shadcn/ui | CSS Modules / Styled Components | No CSS files to maintain, full component control |

---

## Liên kết
- [[01_Design System with Todo List]] — bài viết giải thích từng block theo kiểu narrative
- [[03_Client Component]] — chi tiết về Client Component
- [[04_Server Component]] — chi tiết về Server Component
- [[05_Server Action vs API Routes]] — so sánh hai cách xử lý mutation
- [[06_RLS To Protect User]] — RLS policies chi tiết
