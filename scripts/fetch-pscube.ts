/**
 * P's CUBE データ自動取得スクリプト v6
 *
 * 設定を pscube-config.ts から読み込み、データを取得してMarkdownに出力する。
 *
 * 使い方:
 *   npx ts-node scripts/fetch-pscube.ts --date=2026-02-28
 *   npx ts-node scripts/fetch-pscube.ts --days-ago=1
 *   npx ts-node scripts/fetch-pscube.ts               # 本日のデータ
 */

const { chromium } = require('playwright')
const fs = require('fs')
const pathModule = require('path')

// 設定を読み込み（ts-nodeから実行するためrequireを使用）
const config = require('../lib/pscube-config')
const { DEFAULT_STORE, calculateDiff, buildMachinePageUrl } = config

// デフォルトの機種（北斗転生）
const STORE = DEFAULT_STORE
const MACHINE = STORE.machines[0]

function parseArgs(): { targetDate: string } {
    const args = process.argv.slice(2)
    let dateStr = ''
    let daysAgo = 0

    for (const arg of args) {
        if (arg.startsWith('--date=')) {
            dateStr = arg.split('=')[1]
        }
        if (arg.startsWith('--days-ago=')) {
            daysAgo = parseInt(arg.split('=')[1])
        }
    }

    // --date が指定されていればそのまま使用
    if (dateStr) return { targetDate: dateStr }

    // --days-ago または未指定の場合、JSTで計算
    return { targetDate: getJSTDateStr(daysAgo) }
}

/**
 * JST基準で日付文字列を生成
 */
function getJSTDateStr(daysAgo: number): string {
    const now = new Date()
    // UTC+9のオフセットを加算
    const jstMs = now.getTime() + (9 * 60 * 60 * 1000)
    const jstDate = new Date(jstMs)
    jstDate.setDate(jstDate.getDate() - daysAgo)
    return jstDate.toISOString().split('T')[0] // YYYY-MM-DD
}

interface FetchedRecord {
    machineNo: number
    big: number
    reg: number
    games: number
    diffCalc: number
}

// === メインスクレイピング処理 ===
async function fetchData(dateStr: string): Promise<FetchedRecord[]> {
    // ワイド画面で全カードが表示されるように設定
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const page = await context.newPage()
    const results: FetchedRecord[] = []
    const debugDir = pathModule.join(__dirname, '..', 'data', 'fetched')
    fs.mkdirSync(debugDir, { recursive: true })

    try {
        const url = buildMachinePageUrl(STORE, MACHINE, dateStr)
        console.log(`[1/2] ページにアクセス中...`)
        console.log(`  URL: ${url.substring(0, 100)}...`)

        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
        // JS描画完了を待つ
        await page.waitForTimeout(5000)

        // デバッグスクリーンショット
        await page.screenshot({ path: pathModule.join(debugDir, 'debug_all_machines.png'), fullPage: true })

        // [2/2] 全カードからデータ抽出
        console.log(`[2/2] データ抽出中...`)

        const rangeStart = MACHINE.machineNoRange.start
        const rangeEnd = MACHINE.machineNoRange.end

        // ページ全体のテキストから各台番号のデータをパースする
        const allData = await page.evaluate((range: { start: number; end: number }) => {
            const results: Array<{ machineNo: number; big: number; reg: number; games: number }> = []

            // テキストを行に分解
            const bodyText = document.body.innerText || ''
            const lines = bodyText.split('\n').map((l: string) => l.trim()).filter((l: string) => l)

            let currentNo = 0
            let currentBig = 0
            let currentReg = 0
            let currentGames = 0
            let foundData = false

            for (const line of lines) {
                // 4桁の台番号を検出
                const noMatch = line.match(/^0(\d{3})$/)
                if (noMatch) {
                    const no = parseInt(noMatch[0])
                    if (no >= range.start && no <= range.end) {
                        // 前の台のデータを保存
                        if (currentNo > 0 && foundData) {
                            results.push({
                                machineNo: currentNo,
                                big: currentBig,
                                reg: currentReg,
                                games: currentGames,
                            })
                        }
                        currentNo = no
                        currentBig = 0
                        currentReg = 0
                        currentGames = 0
                        foundData = false
                        continue
                    }
                }

                if (currentNo === 0) continue

                // BIG行を検出
                const bigMatch = line.match(/^BIG\s+(\d+)/)
                if (bigMatch) {
                    currentBig = parseInt(bigMatch[1])
                    foundData = true
                    continue
                }

                // REG行を検出
                const regMatch = line.match(/^REG\s+(\d+)/)
                if (regMatch) {
                    currentReg = parseInt(regMatch[1])
                    continue
                }

                // 累計ゲーム行を検出
                const gamesMatch = line.match(/^累計ゲーム\s+(\d+)/)
                if (gamesMatch) {
                    currentGames = parseInt(gamesMatch[1])
                    continue
                }
            }

            // 最後の台のデータ保存
            if (currentNo > 0 && foundData) {
                results.push({
                    machineNo: currentNo,
                    big: currentBig,
                    reg: currentReg,
                    games: currentGames,
                })
            }

            return results
        }, { start: rangeStart, end: rangeEnd })

        // 取得結果を処理
        for (const data of allData) {
            const diffCalc = calculateDiff(data.big, data.games, MACHINE.diffCalc)
            results.push({
                machineNo: data.machineNo,
                big: data.big,
                reg: data.reg,
                games: data.games,
                diffCalc,
            })
            const sign = diffCalc > 0 ? '+' : ''
            console.log(`  No.${data.machineNo}: BIG=${data.big} REG=${data.reg} G=${data.games} Diff=${sign}${diffCalc}`)
        }

        if (results.length === 0) {
            console.log('\n  カードデータが見つかりません。ページの構造を確認中...')
            // ページ全体のテキストの先頭500文字をデバッグ出力
            const debugText = await page.evaluate(() => {
                return (document.body.innerText || '').substring(0, 500)
            })
            console.log(`  ページテキスト (先頭500文字):\n${debugText}`)
        }

    } catch (e: any) {
        console.error(`Fatal error: ${e.message}`)
        await page.screenshot({ path: pathModule.join(debugDir, 'debug_fatal.png'), fullPage: true }).catch(() => { })
    } finally {
        await browser.close()
    }

    return results
}

// === Markdown出力 ===
function outputMarkdown(records: FetchedRecord[], dateStr: string): string {
    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    const outputDir = pathModule.join(__dirname, '..', 'data', 'fetched')
    const outputPath = pathModule.join(outputDir, `${dateStr}_${MACHINE.dbName}.md`)

    let md = `# ${MACHINE.dbName} ${dateStr}\n`
    md += `店舗: ${STORE.name} | 取得: ${now}\n\n`
    md += `| 台番号 | G数 | BIG | REG | 差枚(計算) | 差枚(確定) | 備考 |\n`
    md += `|:---:|:---:|:---:|:---:|:---:|:---:|:---|\n`

    for (const r of records) {
        if (r.games > 0) {
            md += `| ${r.machineNo} | ${r.games} | ${r.big} | ${r.reg} | ${r.diffCalc > 0 ? '+' : ''}${r.diffCalc} | | |\n`
        } else {
            md += `| ${r.machineNo} | - | - | - | - | | 未稼働 |\n`
        }
    }

    md += `\n## ステータス\n`
    md += `- [x] 取得完了 (${now})\n`
    md += `- [ ] データ確認済み\n`
    md += `- [ ] DB登録済み\n`

    fs.mkdirSync(outputDir, { recursive: true })
    fs.writeFileSync(outputPath, md, 'utf-8')
    console.log(`\n出力: ${outputPath}`)
    return outputPath
}

// === Main ===
async function main() {
    const { targetDate } = parseArgs()

    console.log(`=== P's CUBE データ取得 ===`)
    console.log(`機種: ${MACHINE.dbName}`)
    console.log(`日付: ${targetDate}`)
    console.log(`店舗: ${STORE.name}`)
    console.log(`========================\n`)

    const records = await fetchData(targetDate)

    if (records.length === 0) {
        console.error('\nデータが取得できませんでした。')
        console.log('data/fetched/debug_all_machines.png を確認してください。')
        process.exit(1)
    }

    outputMarkdown(records, targetDate)

    // サマリー
    console.log(`\n=== サマリー ===`)
    console.log(`取得台数: ${records.length}`)
    const activeRecords = records.filter(r => r.games > 0)
    const totalDiff = activeRecords.reduce((sum, r) => sum + r.diffCalc, 0)
    console.log(`稼働台: ${activeRecords.length} / ${records.length}`)
    console.log(`合計差枚(計算): ${totalDiff > 0 ? '+' : ''}${totalDiff}`)
    const plusCount = activeRecords.filter(r => r.diffCalc > 0).length
    console.log(`プラス台: ${plusCount} / ${activeRecords.length}`)
}

main().catch(e => {
    console.error(e)
    process.exit(1)
})
