import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/schema.ts',
    out: './migrations',
    dialect: 'sqlite',
    /*driver: 'd1-http',*/
    dbCredentials: {
        // 以下にSQLiteのpathを指定する必要があるみたい
        url: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/04a1b00e2c3af5922847f9d0da07e4152d2afb7868a58cab60360e16a0974db1.sqlite',
        /*accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
        databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
        token: process.env.CLOUDFLARE_D1_TOKEN!,*/
    },
});
