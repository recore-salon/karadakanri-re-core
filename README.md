# あるもんメンテナンス Re:Stock

> 家にある食材で、今日のごはんを決める。Re:Core 会員向け献立サポートアプリ

## 無料で動かし続けられる構成（月額 $0）

| サービス | 用途 | 無料枠 |
|---------|------|--------|
| **Vercel Hobby** | Next.jsホスティング | 100GB帯域/月 |
| **Supabase Free** | DB + 認証 | 500MB DB / 50K MAU |
| **Google Gemini API** | 献立提案AI | 1,500 req/日・15 req/分 |

## セットアップ手順

### 1. Supabaseプロジェクトを作成
1. [Supabase](https://supabase.com) でプロジェクト作成
2. SQL Editor で `supabase/migrations/001_initial.sql` を実行
3. Project Settings > API から URL と anon key を取得

### 2. Google Gemini APIキーを取得
[Google AI Studio](https://aistudio.google.com/app/apikey) で無料のAPIキーを発行

### 3. 環境変数を設定

```bash
cp .env.local.example .env.local
# .env.local を編集
```

### 4. 起動

```bash
npm install
npm run dev
```

## Vercelデプロイ

```bash
npx vercel --prod
```

Vercelダッシュボードで以下の環境変数を設定:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

Supabase Dashboard > Authentication > URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

> ⚠️ Supabase無料プランは7日間非アクティブでプロジェクトが一時停止します

## Getting Started (開発)

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
