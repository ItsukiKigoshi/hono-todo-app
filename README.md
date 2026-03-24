# Bun + Hono + Drizzle + Cloudflare D1

- Cloudflare D1 (SQLite)以外のさくら，AWS, GCP (PostgreSQL)でも使えるようにORMを挟む.
- うーんRemix/Next.jsでやった方が結局楽なんかな...

## Ref:
- [HonoとCloudflare D1とDrizzle ORMを使ってWeb APIを作る #cloudflare - Qiita](https://qiita.com/kmkkiii/items/2b22fa53a90bf98158c0)
- [Cloudflare Workers + Hono + Vite + React で SSR を実現する](https://zenn.dev/sora_kumo/articles/hono-ssr-react)

---

```txt
bun install
bun dev
```

```txt
bun deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
bun cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

## やったことメモ

- 基本は[このQiita記事](https://qiita.com/kmkkiii/items/2b22fa53a90bf98158c0)をBunに読み替えて実行

### Installation

```bash
$ bun create hono@latest hono-todo-app
# create-hono version 0.19.4
# ✔ Using target directory … hono-todo-app
# ✔ Which template do you want to use? cloudflare-workers
# ✔ Do you want to install project dependencies? Yes
# ✔ Which package manager do you want to use? bun
# ✔ Cloning the template
# ✔ Installing project dependencies
# 🎉 Copied project files
# Get started with: cd hono-todo-app
```

```bash
$ bunx wrangler login
$ bunx wrangler d1 create my-database
# ✔ Would you like Wrangler to add it on your behalf? … yes
# ✔ What binding name would you like to use? … hono_todo_db
# ✔ For local dev, do you want to connect to the remote resource instead of a local resource? … no
```

wragler.tomlはwragler.jsoncになって書き変えの必要無し

Cf. https://bun.com/docs/guides/ecosystem/drizzle

```bash
$ bun add drizzle-orm
$ bun add -D drizzle-kit
```

### ファイル設定

```ts : src/schema.ts
import {sqliteTable, integer, text} from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
    id: integer("id", {mode: "number"}).primaryKey({autoIncrement: true}),
    title: text("title").notNull(),
    status: text("status", {enum: ["todo", "doing", "done"]}).default("todo"),
    createdAt: integer("created_at", {mode: "timestamp"})
        .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", {mode: "timestamp"})
        .$defaultFn(() => new Date()),
});

```

- https://orm.drizzle.team/docs/guides/d1-http-with-drizzle-kit

```ts : drizzle.config.ts
import {defineConfig} from 'drizzle-kit';

export default defineConfig({
    schema: './src/schema.ts',
    out: './migrations',
    dialect: 'sqlite',
    /*driver: 'd1-http',*/
    dbCredentials: {
        url: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/local.sqlite',
        /*accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
        databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
        token: process.env.CLOUDFLARE_D1_TOKEN!,*/
    },
});

```

### Migration

```bash
$ bunx drizzle-kit generate
# No config path provided, using default 'drizzle.config.ts'
# Reading config file '/home/itsukikigoshi/Developpement/hono-todo-app/drizzle.config.ts'
# 1 tables
# todos 5 columns 0 indexes 0 fks

# [✓] Your SQL migration file ➜ migrations/0000_sudden_logan.sql 
```

```jsonc : wrangler.jsonc
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "hono-todo-app",
	"main": "src/index.ts",
	"compatibility_date": "2026-03-17",
	"d1_databases": [
		{
			"binding": "hono_todo_db",
			"database_name": "hono-todo-db",
			"database_id": "38b7f259-5c0b-41e0-9397-f3a2b5b08067",
			"migrations_dir": "./migrations" // この行を追記
		}
	]
}
```

```bash
$ bunx wrangler d1 migrations apply hono-todo-db --local
```

### 寄り道: drizzle-kit studio

UIでデータベースが見れるツール. まだβ.

依存関係で以下を追加.

```bash
$ bun add -D better-sqlite3
$ bun add -D @types/better-sqlite3
```

```bash
$ bunx drizzle-kit studio
```

- Supabaseをセルフホストしたときもこのstudioみたいな操作感なのかな
- ちゃんとtodosテーブルがstudioで見れた!!

### HonoからCRUD操作

```bash
$ bun add -D @cloudflare/workers-types
```

```jsonc : tsconfig.json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "types": [
      "@cloudflare/workers-types" // これを追加
    ],
    "lib": [
      "ESNext"
    ],
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx"
  },
}
```

```ts : src/index.ts
import {Hono} from "hono";
import {drizzle} from "drizzle-orm/d1";
import {todos} from "./schema";
import {eq} from "drizzle-orm";

type Bindings = {
    hono_todo_db: D1Database; // "hono_todo_db"の部分は, wrangler.jsoncのd1_databases/bindingと一致させる!
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => c.text("Hello Hono!"));
/**
 * todos
 */
app.get("/todos", async (c) => {
    const db = drizzle(c.env.hono_todo_db);
    const result = await db.select().from(todos).all();
    return c.json(result);
});

/**
 * create todo
 */
app.post("/todos", async (c) => {
    const params = await c.req.json<typeof todos.$inferSelect>();
    const db = drizzle(c.env.hono_todo_db);
    const result = await db
        .insert(todos)
        .values({title: params.title})
        .execute();
    return c.json(result);
});

/**
 * update todo
 */
app.put("/todos/:id", async (c) => {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
        return c.json({error: "invalid ID"}, 400);
    }

    const params = await c.req.json<typeof todos.$inferSelect>();
    const db = drizzle(c.env.hono_todo_db);
    const result = await db
        .update(todos)
        .set({title: params.title, status: params.status})
        .where(eq(todos.id, id));
    return c.json(result);
});

/**
 * delete todo
 */
app.delete("/todos/:id", async (c) => {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
        return c.json({error: "invalid ID"}, 400);
    }

    const db = drizzle(c.env.hono_todo_db);
    const result = await db.delete(todos).where(eq(todos.id, id));
    return c.json(result);
});

export default app;

```

```bash
$ bun dev
```
