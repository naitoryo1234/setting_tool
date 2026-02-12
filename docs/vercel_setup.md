# Vercel Database Setup & Build Error Fixes

## 1. ビルドエラーの修正について
- **`prisma.config.ts` の削除**: Vercelのビルドエラー (`Cannot find module 'prisma/config'`) を修正するため、不要な設定ファイルを削除しました。
- **`prisma/schema.prisma` の更新**: Vercel Postgres に対応するため、`provider` を `postgresql` に変更しました。

## 2. Vercel Database (Postgres) の設定手順

### 手順1: Vercel Storageの作成
1. Vercelのダッシュボードで対象のプロジェクトを開きます。
2. 上部タブの **"Storage"** をクリックします。
3. **"Create Database"** をクリックし、**"Postgres"** を選択します。
4. データベース名を入力し、リージョン（`Japan (Tokyo) - hnd1` 推奨）を選択して **"Create"** をクリックします。
5. 作成後、**"Connect Project"** で現在のプロジェクトを選択し、**"Connect"** します。

### 手順2: データベースへのテーブル作成（マイグレーション）
1. プロジェクトルートに `.env.local` を作成し、環境変数 (`POSTGRES_PRISMA_URL` 等) を記述します。
2. 以下のコマンドを実行し、リモートDBにスキーマを適用します。
   ```bash
   npx prisma migrate deploy
   ```

**注意**: ローカル環境 (`npm run dev`) で `sqlite` を使用していた場合、この変更によりローカルでも Postgres への接続が必要になります（または `.env` で切り替え）。
一時的に `sqlite` に戻したい場合は、`prisma/schema.prisma` の `provider` を `sqlite` に戻してください（ただしコミット時は `postgresql` にする必要があります）。
