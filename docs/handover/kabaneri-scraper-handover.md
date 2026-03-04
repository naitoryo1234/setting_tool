# カバネリ海門XX スクレイピング機能 — 引き継ぎレポート

作成日: 2026-03-03
作成者: Agent (スクレイピング担当)
引き継ぎ先: メインシステム統合担当Agent

---

## 1. 新規作成・修正したファイルの一覧

### 新規作成

| ファイル / ディレクトリ | 種別 | 説明 |
|:---|:---:|:---|
| `scripts/fetch-kabaneri.ts` | スクリプト | カバネリ海門XX データ自動取得スクリプト（自己完結型） |
| `data/fetched/2026-03-02_カバネリ海門XX.md` | データ | 3/2分の取得済みデータ（差枚未入力） |
| `data/fetched/2026-03-02_カバネリ海門XX_ss/` | ディレクトリ | スクリーンショット格納先 |
| `data/fetched/2026-03-02_カバネリ海門XX_ss/graph_no238.png` 〜 `graph_no245.png` | 画像 | 各台のグラフカード要素SS（8ファイル） |
| `data/fetched/2026-03-02_カバネリ海門XX_ss/debug_list_page.png` | 画像 | リストページ全体のデバッグSS |
| `data/fetched/2026-03-02_カバネリ海門XX_ss/detail_graph.png` | 画像 | 詳細グラフビューSS |

### 修正したファイル

なし（既存ファイルは一切変更していない）

### SSディレクトリ構成

```
data/fetched/2026-03-02_カバネリ海門XX_ss/
├── graph_no238.png    # 各台グラフ要素SS（小サイズ、6-7KB）
├── graph_no239.png
├── graph_no240.png
├── graph_no241.png
├── graph_no242.png
├── graph_no243.png
├── graph_no244.png
├── graph_no245.png
├── debug_list_page.png  # リストページ全体（デバッグ用、5.6MB）
└── detail_graph.png     # 詳細グラフビュー（デバッグ用、6.2MB）
```

> 注意: 開発中の試行錯誤により `no238.png` 〜 `no245.png`（個別ページSSの残骸、各121KB〜4.3MB）も残存しています。これらは不要なので削除して問題ありません。

---

## 2. データの出力形式・保存先

### Markdown形式

出力先: `data/fetched/{YYYY-MM-DD}_カバネリ海門XX.md`

**テーブル列構成:**
```
| 台番号 | G数 | BIG | REG | 最大放出 | 差枚(確定) | 備考 |
```

**北斗転生との列構成の違い（重要）:**

| 列番号 | 北斗転生 | カバネリ海門XX |
|:---:|:---|:---|
| 1 | 台番号 | 台番号 |
| 2 | G数 | G数 |
| 3 | BIG | BIG |
| 4 | REG | REG |
| 5 | **差枚(計算)** | **最大放出** |
| 6 | 差枚(確定) | 差枚(確定) |
| 7 | 備考 | 備考 |

**5列目が異なります。** 北斗転生は係数から差枚を自動計算できるため「差枚(計算)」ですが、カバネリ海門XXはAT機でBIG獲得枚数が可変のため計算不可で、代わりに「最大放出」（1撃最大払出枚数）を格納しています。

### スクリーンショット

出力先: `data/fetched/{YYYY-MM-DD}_カバネリ海門XX_ss/`
- `graph_no{台番号}.png` — 各台のグラフカード要素SS

---

## 3. 実行方法と必要な引数

```bash
# 特定日付のデータを取得
npx tsx scripts/fetch-kabaneri.ts --date=2026-03-02

# N日前のデータを取得
npx tsx scripts/fetch-kabaneri.ts --days-ago=1

# 本日のデータを取得（引数なし）
npx tsx scripts/fetch-kabaneri.ts
```

### 依存関係
- `playwright` — Chromiumベースのブラウザ自動操作（既にプロジェクトに導入済み）
- `tsx` — TypeScript実行（既に導入済み）
- その他の外部パッケージ依存なし

### 処理フロー
1. P's CUBEのリストページにアクセス（headless Chrome）
2. JS描画完了後、ページテキストからデータを正規表現で抽出
3. 各台のグラフカード要素のスクリーンショットを取得
4. 詳細グラフビュー（全台一覧グラフ）のSSを取得
5. Markdown形式で出力

---

## 4. 特記事項・未解決の課題

### 【重要】register-fetched.ts との非互換

`register-fetched.ts` の Markdownパーサー（46行目）の正規表現:
```typescript
const match = line.match(/^\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([+-]?\d+)\s*\|\s*([+-]?\d+)?\s*\|/)
```

このパーサーはカバネリ海門XXのMarkdownを正しく処理できません:
- **5列目を `diffCalc`（差枚計算値）として解釈**してしまうが、実際は「最大放出」
- カバネリは差枚計算が不可能なため、5列目に差枚計算値は存在しない

**統合時の対応案:**
1. `register-fetched.ts` のパーサーを機種ごとに列マッピングを切り替える方式に拡張する
2. あるいは、カバネリ用の Markdown出力列を北斗に合わせて変更する（5列目を`-`で固定して差枚(確定)を6列目に入れる）

### 【重要】pscube-config.ts にカバネリ未登録

`lib/pscube-config.ts` にはまだカバネリ海門XXの `MachineConfig` が追加されていません。
`register-fetched.ts` が season を取得する際に `DEFAULT_STORE.machines.find(...)` で検索するため、
カバネリのレコードが見つからず **season がデフォルトの 1 にフォールバック**します。

登録すべきカバネリの設定:
```typescript
{
    searchName: 'カバネリ',
    dbName: 'カバネリ海門XX',
    machineNoRange: { start: 238, end: 245 },
    machineCount: 8,
    diffCalc: {
        coinsPerBig: 0,    // AT機のため計算不可
        coinsPerGame: 0,
    },
    season: 1,  // 初期設置
    encodedName: 'L+%25E3%2582%25B9%25E3%2583%259E%25E3%2582%25B9%25E3%2583%25AD+%25E3%2582%25AB%25E3%2583%2590%25E3%2583%258D%25E3%2583%25AA%25E6%25B5%25B7%25E9%2596%2580XX',
}
```

### 【重要】DB に Machine レコード未登録

DBの `Machine` テーブルに「カバネリ海門XX」が存在するか未確認です。
`register-fetched.ts` は `prisma.machine.findFirst({ where: { name: { contains: machineName } } })` で
機種を検索するため、DB上に対応するレコードが必要です。

### スクレイピングの安定性

| 項目 | 状態 | 詳細 |
|:---|:---:|:---|
| リストページのデータ取得 | 安定 | 8/8台すべて取得成功。i18n切替にも対応 |
| グラフカードSS | 安定 | 8/8台すべて取得成功 |
| 個別ページへのアクセス | 不可 | error(451) でブロック。現在は利用していない |
| P's CUBEのi18n問題 | 対応済み | ラベルがCSS class名で表示される場合がある（`toku1-count-s` 等）。正規表現で両方のパターンに対応 |

### 差枚数について

- カバネリ海門XX はAT機であり、BIG1回あたりの獲得枚数が可変
- 従って北斗転生のような `(BIG × 係数) - (G数 × 消費)` の差枚計算は不可能
- **差枚はユーザーが別途提供し、Markdownの「差枚(確定)」列に手動で入力する運用**
- 最大放出数は「ある地点からの1撃最大払出枚数」であり、差枚推定には使用不可

### fetch-kabaneri.ts の独立性

現在のスクリプトは `pscube-config.ts` を参照せず、CONFIG を内部に持つ自己完結型です。
統合時に `pscube-config.ts` へ設定を移管し、`fetch-pscube.ts` と統合するか、
別スクリプトとして維持するかは設計判断になります。

---

## 運用ワークフロー（想定）

```
1. npx tsx scripts/fetch-kabaneri.ts --date=YYYY-MM-DD
   → data/fetched/{date}_カバネリ海門XX.md 生成
   → data/fetched/{date}_カバネリ海門XX_ss/ 生成

2. ユーザーがMarkdownの「差枚(確定)」列に値を入力

3. npx ts-node scripts/register-fetched.ts --file=data/fetched/{date}_カバネリ海門XX.md
   → DB登録（※現状は非互換のため要修正）
```
