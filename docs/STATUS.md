# Project Status

**Date:** 2026-02-17
**Current Phase:** Phase 2.5: Analysis & Visualization (Enhanced)

## Overview
ユーザー要望に基づき、分析・統計機能の大幅な強化を実施しました。
特に「北斗転生」などの高稼働機種に向けた詳細データ分析（ベイズ推定による設定推測）と、全機種へのアクセシビリティ向上（トップページ改修）が完了しています。

## Completed Tasks (Recent)
- [x] **Machine Stats Summary**:
    - 機種別サマリーページ (`/history/[machineId]`) の新設。平均RB確率、機械割などの一覧表示。
    - 台別詳細ページ (`/history/[machineId]/[machineNo]`) の機能強化。
- [x] **Setting Estimation (Bayesian)**:
    - 北斗転生のスペック（REG確率＝AT初当り）をベースにした設定推測機能の実装。
    - 期待度グラフ、推定機械割の表示。
- [x] **Navigation**:
    - トップページ (`/`) に「機種別データ一覧」セクションを追加し、導線を強化。
    - 詳細ページヘッダーからのパンくずリスト的遷移の実装。
- [x] **UI improvements**:
    - グラフのツールチップ修正、不要な項目の削除（合算確率など）、ラベルの適正化（BB表記）。

## Unresolved Issues / Pending Tasks
- **Phase 2: Stress-Free Input**:
    - `react-hook-form` 導入とバリデーション強化（継続課題）。
    - インラインエラー表示とトースト通知。

## Next Steps
- User verification of new analysis features in actual operation.
- Proceed with Input Form improvements (Phase 2 original plan).
