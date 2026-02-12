---
description: セッション完了時の引き継ぎレポート（完了タスク、次回のステップ、初期化手順）を作成します。**ユーザーの明示的な指示がない限り実行禁止です。**
---

> **⚠️ Trigger Warning / 実行上の注意**:
> 1. **ユーザー指示必須**: このワークフローは、ユーザーが「セッションを終了して」「ハンドオーバーを作成して」と**明示的に指示した場合にのみ**実行してください。
> 2. **自発的実行の禁止**: タスク完了後にAIが気を利かせて勝手に実行することは**厳禁**です。
> 3. **次回着手の強制禁止**: レポート作成後、勝手に次回のタスク（Next Steps）に着手したり、計画（implementation_plan）を立て始めないでください。ここでセッションは**完全に終了**します。

1. **セッション状態の確認 (Review Session Status)**:
   - `git status` を確認し、作業内容が保存されているかチェックします。
   - specific command: `git status`

2. **変更のコミット (Commit Changes)**:
   - 未保存の変更がある場合、適切なコミットメッセージ（例: `feat: implement phase 7 staff management`）と共にコミットを提案・実行してください。
   - specific command: `git add . && git commit -m "..."`

3. **完了作業の要約 (Summarize Completed Work)**:
   - このセッションで実装した機能（例: Phase 4, 5, 6）を日本語で列挙します。
   - 大きな設計変更（例: 新テーブル `Appointment` 追加）があれば記述します。

4. **計画変更ログの更新 (Update Plan Changelog)** ⚠️ **必須**:
   - `docs/management/PLAN_CHANGELOG.md` に**必ず**このセッションの変更を追記してください。
   - 新しいバージョン番号（例: v1.3.1）を採番し、以下を記述:
     - **変更内容**: 実装した機能の箇条書き
     - **変更の背景 / 意思決定**: なぜその設計に至ったか（重要な議論があれば記録）
   - 小さな修正のみのセッションでも、最低限「バグ修正」「リファクタ」として記録すること。

5. **保留タスクと次のステップ (Identify Pending Tasks & Next Steps)**:
   - 次回セッションの直近の目標（例: 「予約とカルテの紐付け」「担当者設定」）を要約します。
   - specific command: `rg -n "TODO" src` (任意: コード内メモの確認)

6. **技術的なコンテキスト (Document Technical Context)**:
   - 環境固有の要件（例: 「`prisma generate` が必要」「サーバー再起動が必要」）を記述します。
   - 一時的な修正（`@ts-ignore` 等）があれば明記します。

7. **STATUS.md の更新 (Update Status File)** ⚠️ **必須**:
   - `docs/STATUS.md` を**上書き更新**してください:
     - `最終更新`: 現在の日時に更新
     - `Current Phase`: 現在のフェーズを更新
     - `Completed`: 今回完了したタスクを記載
     - `In Progress`: 作業中のタスクがあれば記載
     - `Next Up`: 次回のタスクを優先度順に記載
     - `Known Issues`: 把握している未解決の問題
     - `Environment Notes`: 環境固有の注意点
     - `Session Handover Notes`: 引き継ぎメモ（コンテキスト、決定事項、保留事項）

8. **セッション終了の報告**:
   - 「セッションハンドオーバーが完了しました。STATUS.md と PLAN_CHANGELOG.md を更新しました。」と報告してください。
   - **ここでセッションは完全に終了です。次のタスクには着手しないでください。**
