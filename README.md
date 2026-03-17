# Bun T Hono + JSX + (Drizzle +) Cloudflare D1

## Ref:
- https://qiita.com/kmkkiii/items/2b22fa53a90bf98158c0

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
