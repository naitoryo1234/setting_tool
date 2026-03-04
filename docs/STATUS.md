# Project Status

**Date:** 2026-03-03
**Current Phase:** Phase 3: Content Reorganization & Season Tracking Integration

## Overview
コンテンツ構造の再編成とモバイル環境での視認性向上が完了し、さらに「狙い目ページ」のUI・UXが強化された状態に加えて、新たに「Season（設置世代）」モデルを導入しました。
新台入替や台番変更に伴う「過去の同じ台番の別機種データ」や「配置換え前の過去データ」が現在のデータと混在して集計されてしまう問題を解決し、分析の精度が大幅に向上しました。

## Completed Tasks (Recent)
- [x] **Season（世代）モデルの導入と集計ロジック改修**:
    - Prismaスキーマの `MachineNumber` と `Record` に `season` (Int) を追加。
    - 既存データの `season` を `1` に移行し、配置変更後（例: 3/2の北斗転生）のデータを `season: 2` として登録・管理できる基盤を確立。
    - `TargetsClient` (狙い台分析) や `getSummary`, `getAnalysis` 等のAPIにおいて、Season単位で独立して集計・ランキング化するロジックへ修正。
    - UI上での新旧判別のため、Season2以上の場合は「第N期」バッジを付与する視覚的サポートを追加。
- [x] **狙い目ページ（/targets）の機能改善**:
    - ワンタップ期間指定（プリセット日）ボタンの追加とカスタム指定の両立
    - 選択状況の `localStorage` 記憶と自動集計機能の実装
- [x] **カバネリ海門XX スクレイピングデータの統合**:
    - 別エージェントが作成したデータ取得結果（`fetch-kabaneri`）を、既存のSeasonモデルと連携させるため `pscube-config.ts` へ登録。
    - `register-fetched.ts` に機種名判定による専用の正規表現パース（「最大放出」列の除外と「差枚(確定)」の登録）ロジックを実装。
    - 手動入力による差枚データのDBへの一括登録フローを確立。
- [x] **分析ページ (Analysis) のUI微調整と強化**:
    - デザインに合わない過剰なアイコン装飾（Sparkles等）を削除。
    - 数値表示エフェクト(`glow-value`)のぼかしレベルを大幅に削減（20px→5px）して視認性を向上。
    - **Season切り替えの実装**: 機種別一覧ページにて、過去の設置世代（Season1等）に動的切り替え可能なドロップダウンを追加。
    - **モバイルUI最適化**: スマホ表示時のヘッダー要素（Season選択や期間指定ボタン）が重ならず整列するようFlexboxレイアウトを再構築。

## Unresolved Issues / Pending Tasks
- **Phase 2: Stress-Free Input**:
    - `react-hook-form` 導入とバリデーション強化（継続課題）。
    - インラインエラー表示とトースト通知の実装。
- **将来課題**:
    - Windowsタスクスケジューラによる毎日0時のデータ自動取得機能構築

## Next Steps
- 継続的なユーザー運用（`/fetch-hodogaya-tensei-data`等による日次データ取得）
- Input Formのさらなる改善（Phase 2: Stress-Free Input）

## Session Handover Notes
- **Season（設置世代）管理の運用について**: 今後、新台入替や配置変更が発生した場合は、`lib/pscube-config.ts` の `season` 値をインクリメント（例: 2→3）してデータ取得を行うことで、過去のデータと混在せず安全に別台として分析を開始できます。
- **運用方法**: 日々のデータはユーザーがチャットで `/fetch-hodogaya-tensei-data` + 日付を指定し、DBに登録するフローが定着しています。
