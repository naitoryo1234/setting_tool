# Vercel Database Setup & Build Error Fixes

## 1. ビルドエラーの修正について
`app/machines/page.tsx` で発生していた型エラー（`MachineNumberMismatch`）を修正しました。
- `MachinesClient.tsx` の型定義を `lib/actions.ts` の定義と統一しました。
- `package.json` に `postinstall: "prisma generate"` を追加し、Vercelビルド時に確実にPrisma Clientが生成されるようにしました。

## 2. Vercel Database (Postgres) の設定手順

Vercelでデータベースを使用するには、以下の手順で設定を行ってください。

### 手順1: Vercel Storageの作成
1. Vercelのダッシュボードで対象のプロジェクトを開きます。
2. 上部タブの **"Storage"** をクリックします。
3. **"Create Database"** をクリックし、**"Postgres"** を選択します。
4. データベース名（例: `setting-tool-db`）を入力し、リージョンを選択（日本なら `Japan (Tokyo) - hnd1` 推奨）して **"Create"** をクリックします。
5. 作成後、**"Connect Project"** で現在のプロジェクトを選択し、**"Connect"** します。
   - これにより、必要な環境変数（`POSTGRES_PRISMA_URL` 等）が自動的に設定されます。

### 手順2: データベースへのテーブル作成（マイグレーション）
データベースは作成されましたが、まだ空の状態です。以下のいずれかの方法でテーブルを作成します。

#### 方法A: Vercelの管理画面から (推奨・簡単)
1. ローカルPCで、Vercelプロジェクトの設定から環境変数を取得します。
   - `vercel env pull .env.local` （Vercel CLIが必要）
   - または、Vercelダッシュボードの **Settings > Environment Variables** から `POSTGRES_PRISMA_URL` などの値をコピーして、ローカルの `.env` に追記します。
2. ローカルターミナルで以下を実行し、リモートDBにスキーマを適用します。
   ```bash
   npx prisma migrate deploy
   ```

#### 方法B: ビルドコマンドで実行
`package.json` の `build` スクリプトを以下のように変更することも可能ですが、運用中の事故を防ぐため、最初のうちは手動（方法A）をお勧めします。

## 3. 次のステップ
設定完了後、Vercelの **"Deployments"** タブから、失敗したデプロイを **"Redeploy"** してください。
修正コードとデータベース設定が正しければ、ビルドが成功するはずです。
