# Bun + Hono + Vite + Drizzle + Cloudflare D1

- Cloudflare D1 (SQLite)以外のさくら，AWS, GCP (PostgreSQL)でも使えるようにORMを挟む.
- うーんNext.jsでやった方が結局楽なんかな...

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
