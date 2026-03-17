import { Hono } from "hono";
import { jsx } from "hono/jsx";
import { drizzle } from "drizzle-orm/d1";
import { todos } from "./schema";
import { eq } from "drizzle-orm";

type Bindings = { hono_todo_db: D1Database };
const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
    const db = drizzle(c.env.hono_todo_db);
    const todoList = await db.select().from(todos).all();

    return c.html(
        <html>
        <head>
            <title>Hono Native JS Todo</title>
        </head>
        <body>
        <h1>Todo List</h1>

        {/* 追加フォーム */}
        <div style="margin-bottom: 20px;">
            <input id="new-todo-title" type="text" placeholder="なにをする？" />
            <button onclick="addTodo()">追加</button>
        </div>

        <ul id="todo-list">
            {todoList.map((t) => (
                <li id={`todo-${t.id}`}>
                    {t.title} [ {t.status} ]
                    <button onclick={`deleteTodo(${t.id})`}>消す</button>
                </li>
            ))}
        </ul>

        {/* --- JS (Fetch API) */}
        <script dangerouslySetInnerHTML={{ __html: `
          async function addTodo() {
            const input = document.getElementById('new-todo-title');
            const title = input.value;
            if (!title) return;

            const res = await fetch('/todos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title })
            });

            if (res.ok) {
              location.reload(); // 成功したらリロードして再描画
            }
          }

          async function deleteTodo(id) {
            if (!confirm('消す？')) return;

            const res = await fetch(\`/todos/\${id}\`, {
              method: 'DELETE'
            });

            if (res.ok) {
              // リロードせずにDOMから直接消す
              document.getElementById(\`todo-\${id}\`).remove();
            }
          }
        `}} />
        </body>
        </html>
    );
});

// --- APIエンドポイント (JSONを返す/受け取る) ---
app.post("/todos", async (c) => {
    const body = await c.req.json();
    const db = drizzle(c.env.hono_todo_db);
    const result = await db.insert(todos).values({ title: body.title }).returning();
    return c.json(result);
});

app.delete("/todos/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    await drizzle(c.env.hono_todo_db).delete(todos).where(eq(todos.id, id));
    return c.json({ success: true });
});

export default app;