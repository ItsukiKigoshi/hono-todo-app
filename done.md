# やったことメモ
- 基本は[このQiita記事](https://qiita.com/kmkkiii/items/2b22fa53a90bf98158c0)をBunに読み替えて実行

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
$ bunx wrangler loginin
# ✔ Would you like Wrangler to add it on your behalf? … yes
# ✔ What binding name would you like to use? … hono_todo_db
# ✔ For local dev, do you want to connect to the remote resource instead of a local resource? … no
```

wragler.tomlはwragler.jsoncになって書き変えの必要無し

```bash
$ bun dev
```

Cf. https://bun.com/docs/guides/ecosystem/drizzle
```bash
$ bun add drizzle-orm
$ bun add -D drizzle-kit
```