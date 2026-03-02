# プロジェクト設定 - 設鑑 (SEKKAN)

## コマンド実行ポリシー

以下のコマンドは `SafeToAutoRun: true` で自動実行してよい：

- **git**: `git add`, `git status`, `git diff`, `git log`, `git commit`, `git push`, `git pull`, `git branch`, `git checkout`, `git stash`
- **npm**: `npm run build`, `npm run dev`, `npm run lint`, `npm install`, `npx`
- **ファイル操作**: `cat`, `type`, `Get-Content`, `Get-ChildItem`, `dir`
- **検索**: `rg` (ripgrep), `Select-String`
- **prisma**: `npx prisma db push`, `npx prisma generate`, `npx prisma studio`
- **tsx**: `npx tsx scripts/*`

## プロジェクト概要

- **名称**: 設鑑 (SEKKAN)
- **用途**: パチスロ稼働データ蓄積・設定分析ツール
- **技術スタック**: Next.js / TypeScript / Prisma / Vercel / SQLite
- **デザインテーマ**: 墨×朱（和モダンハイブリッド）
