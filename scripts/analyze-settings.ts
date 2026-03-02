/**
 * 北斗転生 設定分析スクリプト
 * backup_data.json から北斗転生のデータを読み込み、
 * 設定傾向の分析レポートをMarkdownで出力する。
 */

import * as fs from 'fs'
import * as path from 'path'

// --- データ読み込み ---
const dataPath = path.join(__dirname, '..', 'backup_data.json')
const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

const TENSEI_ID = 'cmlj5u7rv000172g9pyrlc8tu'
const MIN_GAMES = 1000 // 高設定判定に必要な最低回転数
const REG_THRESHOLD = 250 // REG確率 1/X 以下で高設定候補

interface Record {
    date: string
    machineNo: number
    diff: number
    big: number
    reg: number
    games: number
}

// 北斗転生のレコードだけ抽出
const allRecords: Record[] = raw.records
    .filter((r: any) => r.machineId === TENSEI_ID)
    .map((r: any) => ({
        date: r.date.split('T')[0], // YYYY-MM-DD（UTCの日付部分）
        machineNo: r.machineNo,
        diff: r.diff,
        big: r.big || 0,
        reg: r.reg || 0,
        games: r.games || 0,
    }))

// 日付を正規化（JST基準: 15:00 UTCは翌日のデータ）
for (const r of allRecords) {
    const orig = raw.records.find((x: any) => x.machineId === TENSEI_ID && x.machineNo === r.machineNo && x.date.startsWith(r.date))
    if (orig) {
        const d = new Date(orig.date)
        const hours = d.getUTCHours()
        if (hours === 15) {
            // 15:00 UTC = 翌日 0:00 JST → 日付を+1する
            d.setUTCDate(d.getUTCDate() + 1)
            r.date = d.toISOString().split('T')[0]
        }
    }
}

// ソート
allRecords.sort((a, b) => a.date.localeCompare(b.date) || a.machineNo - b.machineNo)

const dates = [...new Set(allRecords.map(r => r.date))].sort()
const machineNos = [...new Set(allRecords.map(r => r.machineNo))].sort((a, b) => a - b)

// --- ヘルパー ---
function regProb(games: number, reg: number): number {
    return reg > 0 ? Math.round(games / reg) : 9999
}

function isHighSetting(r: Record): boolean {
    return r.games >= MIN_GAMES && regProb(r.games, r.reg) <= REG_THRESHOLD
}

function getRecord(date: string, machineNo: number): Record | undefined {
    return allRecords.find(r => r.date === date && r.machineNo === machineNo)
}

function getDayRecords(date: string): Record[] {
    return allRecords.filter(r => r.date === date)
}

function rankByDiff(records: Record[]): Record[] {
    return [...records].sort((a, b) => a.diff - b.diff) // 最も凹んでいる順（昇順）
}

// --- レポート生成 ---
const lines: string[] = []
function out(s: string = '') { lines.push(s) }

out('# 北斗転生 設定分析レポート')
out()
out(`- **対象**: 保土ヶ谷ガイア 北斗転生（#${machineNos[0]}〜#${machineNos[machineNos.length - 1]}、${machineNos.length}台）`)
out(`- **期間**: ${dates[0]} 〜 ${dates[dates.length - 1]}（${dates.length}日分）`)
out(`- **総レコード数**: ${allRecords.length}件`)
out(`- **高設定候補の定義**: REG確率 ≤ 1/${REG_THRESHOLD}（${MIN_GAMES}G以上の台のみ）`)
out()

// =============================================
// Step 1: データ俯瞰
// =============================================
out('---')
out('## Step 1: データ俯瞰（日付 × 台番号マトリクス）')
out()
out('各セルの上段が差枚、下段がREG確率。⭐ は高設定候補。')
out()

// テーブルヘッダー
out(`| 日付 | ${machineNos.map(n => `#${n}`).join(' | ')} |`)
out(`| --- | ${machineNos.map(() => '---').join(' | ')} |`)

for (const date of dates) {
    const cells = machineNos.map(no => {
        const r = getRecord(date, no)
        if (!r) return '-'
        const diff = r.diff > 0 ? `+${r.diff}` : `${r.diff}`
        const rp = regProb(r.games, r.reg)
        const rpStr = rp < 9999 ? `1/${rp}` : '-'
        const star = isHighSetting(r) ? '⭐' : ''
        return `${diff} (R${rpStr}) ${star}`
    })
    out(`| ${date} | ${cells.join(' | ')} |`)
}
out()

// =============================================
// Step 2: 高設定候補台の抽出
// =============================================
out('---')
out('## Step 2: 高設定候補台の一覧')
out()

const highSettingRecords = allRecords.filter(r => isHighSetting(r))
out(`高設定候補台: **${highSettingRecords.length}件** / ${allRecords.length}件中`)
out()

if (highSettingRecords.length > 0) {
    out('| 日付 | 台番号 | 差枚 | G数 | BIG | REG | REG確率 |')
    out('| --- | --- | --- | --- | --- | --- | --- |')
    for (const r of highSettingRecords) {
        const diff = r.diff > 0 ? `+${r.diff}` : `${r.diff}`
        out(`| ${r.date} | #${r.machineNo} | ${diff} | ${r.games} | ${r.big} | ${r.reg} | 1/${regProb(r.games, r.reg)} |`)
    }
    out()
}

// =============================================
// Step 3: 仮説検証① — 前日凹み台に設定は入るか？
// =============================================
out('---')
out('## Step 3: 仮説検証① — 前日凹み台に設定は入るか？')
out()

interface PrevDayAnalysis {
    date: string
    machineNo: number
    regProb: number
    diff: number
    prevDayDiff: number | null
    prevDayRank: number | null // 13台中の順位（1=最も凹み）
    prevDayTotal: number // 前日のデータがある台数
}

const prevDayResults: PrevDayAnalysis[] = []

for (const hr of highSettingRecords) {
    const dateIdx = dates.indexOf(hr.date)
    if (dateIdx <= 0) continue // 前日データなし
    const prevDate = dates[dateIdx - 1]

    const prevDayRecords = getDayRecords(prevDate)
    if (prevDayRecords.length === 0) continue

    const prevRecord = prevDayRecords.find(r => r.machineNo === hr.machineNo)
    const ranked = rankByDiff(prevDayRecords)
    const rankIdx = ranked.findIndex(r => r.machineNo === hr.machineNo)

    prevDayResults.push({
        date: hr.date,
        machineNo: hr.machineNo,
        regProb: regProb(hr.games, hr.reg),
        diff: hr.diff,
        prevDayDiff: prevRecord ? prevRecord.diff : null,
        prevDayRank: rankIdx >= 0 ? rankIdx + 1 : null,
        prevDayTotal: ranked.length,
    })
}

if (prevDayResults.length > 0) {
    out('### 高設定候補台の前日データ')
    out()
    out('| 当日 | 台番号 | REG確率 | 差枚 | 前日差枚 | 前日順位(凹み順) |')
    out('| --- | --- | --- | --- | --- | --- |')
    for (const r of prevDayResults) {
        const diff = r.diff > 0 ? `+${r.diff}` : `${r.diff}`
        const prevDiff = r.prevDayDiff !== null ? (r.prevDayDiff > 0 ? `+${r.prevDayDiff}` : `${r.prevDayDiff}`) : 'N/A'
        const rank = r.prevDayRank !== null ? `${r.prevDayRank}/${r.prevDayTotal}位` : 'N/A'
        out(`| ${r.date} | #${r.machineNo} | 1/${r.regProb} | ${diff} | ${prevDiff} | ${rank} |`)
    }
    out()

    // 集計
    const withPrevData = prevDayResults.filter(r => r.prevDayDiff !== null)
    if (withPrevData.length > 0) {
        const prevDiffs = withPrevData.map(r => r.prevDayDiff!)
        const avgPrevDiff = Math.round(prevDiffs.reduce((a, b) => a + b, 0) / prevDiffs.length)
        const medianPrevDiff = prevDiffs.sort((a, b) => a - b)[Math.floor(prevDiffs.length / 2)]
        const negativeCount = prevDiffs.filter(d => d < 0).length
        const positiveCount = prevDiffs.filter(d => d > 0).length

        const prevRanks = withPrevData.filter(r => r.prevDayRank !== null).map(r => r.prevDayRank!)
        const avgRank = prevRanks.length > 0 ? (prevRanks.reduce((a, b) => a + b, 0) / prevRanks.length).toFixed(1) : '-'
        const worstCount = prevRanks.filter(r => r <= 3).length // 凹み上位3位以内

        out('### 統計サマリー')
        out()
        out(`| 指標 | 値 |`)
        out(`| --- | --- |`)
        out(`| 分析対象数 | ${withPrevData.length}件 |`)
        out(`| 前日差枚 平均 | ${avgPrevDiff > 0 ? '+' : ''}${avgPrevDiff} |`)
        out(`| 前日差枚 中央値 | ${medianPrevDiff > 0 ? '+' : ''}${medianPrevDiff} |`)
        out(`| 前日マイナスだった台の割合 | ${negativeCount}/${withPrevData.length} (${Math.round(negativeCount / withPrevData.length * 100)}%) |`)
        out(`| 前日プラスだった台の割合 | ${positiveCount}/${withPrevData.length} (${Math.round(positiveCount / withPrevData.length * 100)}%) |`)
        out(`| 前日の凹み順位 平均 | ${avgRank}位 / ${withPrevData[0]?.prevDayTotal || 13}台中 |`)
        out(`| 前日凹み上位3位以内だった割合 | ${worstCount}/${prevRanks.length} (${Math.round(worstCount / prevRanks.length * 100)}%) |`)
        out()

        // 前日最凹み台が翌日高設定になった割合
        let worstBecameHigh = 0
        let worstTotal = 0
        for (let i = 1; i < dates.length; i++) {
            const prevRecs = getDayRecords(dates[i - 1])
            if (prevRecs.length === 0) continue
            const worst = rankByDiff(prevRecs)[0] // 最も凹んでいた台
            worstTotal++
            const nextDayRec = getRecord(dates[i], worst.machineNo)
            if (nextDayRec && isHighSetting(nextDayRec)) {
                worstBecameHigh++
            }
        }
        out(`### 前日最凹み台 → 翌日高設定候補になった割合`)
        out()
        out(`**${worstBecameHigh} / ${worstTotal} 日 (${worstTotal > 0 ? Math.round(worstBecameHigh / worstTotal * 100) : 0}%)**`)
        out()
    }
} else {
    out('前日データがある高設定候補台がありませんでした。')
    out()
}

// =============================================
// Step 4: 仮説検証② — 週間で一番凹んでいる台に設定は入るか？
// =============================================
out('---')
out('## Step 4: 仮説検証② — 週間累計で一番凹んでいる台に設定は入るか？')
out()

interface WeeklyAnalysis {
    date: string
    worstMachineNo: number
    worstWeeklyDiff: number
    becameHighSetting: boolean
    highSettingRegProb?: number
}

const weeklyResults: WeeklyAnalysis[] = []

for (let i = 0; i < dates.length; i++) {
    // 直近7日間（当日含む）の累計差枚で最も悪い台
    const lookbackDates = dates.filter((d, idx) => idx <= i && idx > i - 7)

    const weeklyDiffByMachine = new Map<number, number>()
    for (const d of lookbackDates) {
        for (const r of getDayRecords(d)) {
            weeklyDiffByMachine.set(r.machineNo, (weeklyDiffByMachine.get(r.machineNo) || 0) + r.diff)
        }
    }

    if (weeklyDiffByMachine.size === 0) continue

    let worstNo = -1
    let worstDiff = Infinity
    for (const [no, diff] of weeklyDiffByMachine) {
        if (diff < worstDiff) {
            worstDiff = diff
            worstNo = no
        }
    }

    // 翌日に高設定候補になったか？
    if (i < dates.length - 1) {
        const nextDate = dates[i + 1]
        const nextRec = getRecord(nextDate, worstNo)
        const becameHigh = nextRec ? isHighSetting(nextRec) : false

        weeklyResults.push({
            date: dates[i],
            worstMachineNo: worstNo,
            worstWeeklyDiff: worstDiff,
            becameHighSetting: becameHigh,
            highSettingRegProb: becameHigh && nextRec ? regProb(nextRec.games, nextRec.reg) : undefined,
        })
    }
}

if (weeklyResults.length > 0) {
    out('| 基準日 | 週間最凹み台 | 週間累計差枚 | 翌日高設定? |')
    out('| --- | --- | --- | --- |')
    for (const w of weeklyResults) {
        const label = w.becameHighSetting ? `✅ (1/${w.highSettingRegProb})` : '❌'
        out(`| ${w.date} | #${w.worstMachineNo} | ${w.worstWeeklyDiff > 0 ? '+' : ''}${w.worstWeeklyDiff} | ${label} |`)
    }

    const hitCount = weeklyResults.filter(w => w.becameHighSetting).length
    out()
    out(`**的中率: ${hitCount} / ${weeklyResults.length} 日 (${Math.round(hitCount / weeklyResults.length * 100)}%)**`)
    out()
}

// =============================================
// Step 5: その他の傾向分析
// =============================================
out('---')
out('## Step 5: その他の傾向')
out()

// 5-a: 曜日別
out('### 曜日別 高設定候補出現数')
out()
const dowLabels = ['日', '月', '火', '水', '木', '金', '土']
const dowCount = new Map<number, { total: number; high: number }>()
for (const date of dates) {
    const dow = new Date(date + 'T00:00:00+09:00').getDay()
    if (!dowCount.has(dow)) dowCount.set(dow, { total: 0, high: 0 })
    dowCount.get(dow)!.total++

    const dayHighCount = getDayRecords(date).filter(r => isHighSetting(r)).length
    dowCount.get(dow)!.high += dayHighCount
}

out('| 曜日 | 日数 | 高設定候補台数 | 1日あたり平均 |')
out('| --- | --- | --- | --- |')
for (let dow = 0; dow < 7; dow++) {
    const data = dowCount.get(dow)
    if (!data) continue
    out(`| ${dowLabels[dow]} | ${data.total} | ${data.high} | ${(data.high / data.total).toFixed(1)} |`)
}
out()

// 5-b: 台番号別の高設定候補回数
out('### 台番号別 高設定候補の出現回数')
out()
out('| 台番号 | 高設定候補回数 | データ日数 | 出現率 |')
out('| --- | --- | --- | --- |')
for (const no of machineNos) {
    const noRecords = allRecords.filter(r => r.machineNo === no)
    const eligibleRecords = noRecords.filter(r => r.games >= MIN_GAMES) // 回転数の足りるものだけ
    const highCount = noRecords.filter(r => isHighSetting(r)).length
    const rate = eligibleRecords.length > 0 ? Math.round(highCount / eligibleRecords.length * 100) : 0
    out(`| #${no} | ${highCount} | ${eligibleRecords.length} | ${rate}% |`)
}
out()

// 5-c: 据え置き（連続高設定）
out('### 据え置き分析（連続高設定候補）')
out()
let consecutiveCount = 0
const consecutiveDetails: string[] = []
for (let i = 1; i < dates.length; i++) {
    const prevHighs = getDayRecords(dates[i - 1]).filter(r => isHighSetting(r))
    const currHighs = getDayRecords(dates[i]).filter(r => isHighSetting(r))
    for (const ph of prevHighs) {
        if (currHighs.some(ch => ch.machineNo === ph.machineNo)) {
            consecutiveCount++
            consecutiveDetails.push(`#${ph.machineNo}: ${dates[i - 1]} → ${dates[i]}`)
        }
    }
}
out(`2日連続で高設定候補となったケース: **${consecutiveCount}件**`)
if (consecutiveDetails.length > 0) {
    out()
    for (const d of consecutiveDetails) {
        out(`- ${d}`)
    }
}
out()

// --- 出力 ---
const reportPath = path.join(__dirname, '..', 'docs', 'analysis', 'hokuto-tensei-report.md')
const reportDir = path.dirname(reportPath)
if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true })
fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8')
console.log(`レポートを出力しました: ${reportPath}`)
