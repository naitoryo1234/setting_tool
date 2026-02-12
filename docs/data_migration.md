# Data Migration Guide

## 1. データ損失を防ぐための戦略
Vercel等の外部データベースに切り替える際、ローカルのデータ（SQLite等）は自動的に移行されません。
そのため、以下の手順で「ローカルデータのバックアップ」と「新データベースへのリストア」を行う必要があります。

**重要な注意点:**
- `prisma/seed.ts`, `scripts/restore_data.ts` の型エラーは、ローカル環境で `prisma generate` （または `npm install`）を実行し、Prisma Clientを最新化することで解消される場合があります。
- Vercelビルド時は `postinstall` で自動生成されるため問題ありません。

## 2. 移行手順

### ステップA: ローカルデータのバックアップ
まだローカルDB (SQLite) に接続されている状態で、以下のコマンドを実行します。
```bash
npm run backup
```
成功すると、プロジェクトルートに `backup_data.json` が生成されます。このファイルには全てのデータが含まれています。

### ステップB: データベース接続の切り替え
1. `.env.local` を作成（または編集）し、Vercel (Postgres) の接続情報を記述します。
2. これにより、アプリケーションは新しい空のデータベースを参照するようになります。

### ステップC: スキーマの適用
新しいデータベースに対してテーブルを作成します。
```bash
npx prisma migrate deploy
```

### ステップD: データのリストア（復元）
バックアップしたJSONデータを、新しいデータベースに投入します。
```bash
npm run restore
```
※ `scripts/restore_data.ts` が実行され、`backup_data.json` の内容がDBに登録されます。

## 3. 確認
`npm run dev` でアプリを起動し、データが正しく表示されるか確認してください。
