/**
 * カバネリ海門XX データ取得スクリプト
 *
 * P's CUBE から L スマスロ カバネリ海門XX の全台データを取得する。
 * リストページからテーブルデータ（台番号, BIG, REG, G数, 最大放出数）と
 * 各台のグラフカードのスクリーンショットを取得し、Markdown形式で出力する。
 *
 * 差枚数はこの機種ではBIG係数計算が不可能なため、ユーザーが別途提供する。
 *
 * 使い方:
 *   npx tsx scripts/fetch-kabaneri.ts --date=2026-03-02
 *   npx tsx scripts/fetch-kabaneri.ts --days-ago=1
 *   npx tsx scripts/fetch-kabaneri.ts               # 本日のデータ
 *
 * 出力:
 *   data/fetched/{date}_カバネリ海門XX.md          - データテーブル
 *   data/fetched/{date}_カバネリ海門XX_ss/         - グラフSS
 */

const { chromium } = require('playwright')
const fs = require('fs')
const pathModule = require('path')

// === Machine Config ===
const CONFIG = {
    storeName: '保土ヶ谷ガイア',
    machineName: 'カバネリ海門XX',
    baseUrl: 'https://www.pscube.jp/dedamajyoho-P-townDMMpachi/c745639/cgi-bin',
    listPage: 'nc-v05-011.php',
    params: {
        cd_ps: '2',
        bai: '21.7391',
    },
    encodedName:
        'L+%25E3%2582%25B9%25E3%2583%259E%25E3%2582%25B9%25E3%2583%25AD+%25E3%2582%25AB%25E3%2583%2590%25E3%2583%258D%25E3%2583%25AA%25E6%25B5%25B7%25E9%2596%2580XX',
    machineNoRange: { start: 238, end: 245 },
    machineCount: 8,
    // Hash fragment params specific to this machine listing
    hashParam2: '2100',
    hashParam8: '604',
}

// === Types ===
interface MachineRecord {
    machineNo: number
    games: number
    big: number
    reg: number
    maxPayout: number | null     // 最大放出数
    screenshotPath: string | null
}

// === Argument Parser ===
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

    if (dateStr) return { targetDate: dateStr }
    return { targetDate: getJSTDateStr(daysAgo) }
}

function getJSTDateStr(daysAgo: number): string {
    const now = new Date()
    const jstMs = now.getTime() + 9 * 60 * 60 * 1000
    const jstDate = new Date(jstMs)
    jstDate.setDate(jstDate.getDate() - daysAgo)
    return jstDate.toISOString().split('T')[0]
}

// === URL Builders ===
function buildListPageUrl(dateStr: string): string {
    const dateCompact = dateStr.replace(/-/g, '')
    const hash = `#${CONFIG.machineCount};${CONFIG.hashParam2};${dateCompact};0;cd_dai;1;0;${CONFIG.hashParam8}`
    return `${CONFIG.baseUrl}/${CONFIG.listPage}?cd_ps=${CONFIG.params.cd_ps}&bai=${CONFIG.params.bai}&nmk_kisyu=${CONFIG.encodedName}${hash}`
}

// === Main Scraping ===
async function fetchData(dateStr: string): Promise<MachineRecord[]> {
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    })
    const page = await context.newPage()
    const results: MachineRecord[] = []

    const outputDir = pathModule.join(__dirname, '..', 'data', 'fetched')
    const ssDir = pathModule.join(outputDir, `${dateStr}_${CONFIG.machineName}_ss`)
    fs.mkdirSync(ssDir, { recursive: true })

    try {
        // Step 1: Fetch the main list page
        const listUrl = buildListPageUrl(dateStr)
        console.log(`[1/3] リストページにアクセス中...`)
        console.log(`  URL: ${listUrl.substring(0, 120)}...`)

        await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 })
        await page.waitForTimeout(5000)

        // Debug screenshot of the list page
        await page.screenshot({
            path: pathModule.join(ssDir, 'debug_list_page.png'),
            fullPage: true,
        })
        console.log(`  リストページSS保存: debug_list_page.png`)

        // Step 2: Extract table data from the rendered page
        console.log(`[2/3] テーブルデータ抽出中...`)

        const rangeStart = CONFIG.machineNoRange.start
        const rangeEnd = CONFIG.machineNoRange.end

        // Extract data using multiple strategies
        const extractedData = await page.evaluate(
            (range: { start: number; end: number }) => {
                const results: Array<{
                    machineNo: number
                    big: number
                    reg: number
                    games: number
                    maxPayout: number | null  // 最大放出
                }> = []

                const bodyText = document.body.innerText || ''
                const lines = bodyText
                    .split('\n')
                    .map((l: string) => l.trim())
                    .filter((l: string) => l)

                // Debug: collect first 2000 chars
                const debugText = bodyText.substring(0, 2000)

                let currentNo = 0
                let currentBig = 0
                let currentReg = 0
                let currentGames = 0
                let currentMaxPayout: number | null = null
                let foundData = false

                for (const line of lines) {
                    // Detect 3-4 digit machine numbers (e.g., "238", "0238")
                    const noMatch = line.match(/^0?(\d{3})$/)
                    if (noMatch) {
                        const no = parseInt(noMatch[1])
                        if (no >= range.start && no <= range.end) {
                            if (currentNo > 0 && foundData) {
                                results.push({
                                    machineNo: currentNo,
                                    big: currentBig,
                                    reg: currentReg,
                                    games: currentGames,
                                    maxPayout: currentMaxPayout,
                                })
                            }
                            currentNo = no
                            currentBig = 0
                            currentReg = 0
                            currentGames = 0
                            currentMaxPayout = null
                            foundData = false
                            continue
                        }
                    }

                    if (currentNo === 0) continue

                    // Detect BIG / 特賞1 count
                    // Handles: "BIG 20", "特賞1 20", "toku1-count-s\t20"
                    const bigMatch = line.match(/^(?:BIG|特賞1|toku1-count\S*)\s+(\d+)/)
                    if (bigMatch) {
                        currentBig = parseInt(bigMatch[1])
                        foundData = true
                        continue
                    }

                    // Detect REG / 特賞5 count
                    // Handles: "REG 12", "特賞5 12", "toku5-count-s\t12"
                    const regMatch = line.match(/^(?:REG|特賞5|toku5-count\S*)\s+(\d+)/)
                    if (regMatch) {
                        currentReg = parseInt(regMatch[1])
                        continue
                    }

                    // Detect games count
                    // Handles: "累計ゲーム 3974", "sum_game-s\t3974"
                    const gamesMatch = line.match(/^(?:累計ゲーム|ゲーム数|G数|sum_game\S*)\s+([\d,]+)/)
                    if (gamesMatch) {
                        currentGames = parseInt(gamesMatch[1].replace(/,/g, ''))
                        continue
                    }

                    // Detect 最大放出数 / max payout
                    // Handles: "最大放出数 1249", "最大放出 1249", "sadama_s-s\t1249"
                    const maxPayoutMatch = line.match(/^(?:最大放出\S*|sadama_s\S*)\s+([+-]?[\d,]+)/)
                    if (maxPayoutMatch) {
                        currentMaxPayout = parseInt(maxPayoutMatch[1].replace(/,/g, ''))
                        continue
                    }

                }

                // Save last machine data
                if (currentNo > 0 && foundData) {
                    results.push({
                        machineNo: currentNo,
                        big: currentBig,
                        reg: currentReg,
                        games: currentGames,
                        maxPayout: currentMaxPayout,
                    })
                }

                return { results, debugText }
            },
            { start: rangeStart, end: rangeEnd }
        )

        // Log extracted data
        if (extractedData.results.length > 0) {
            for (const data of extractedData.results) {
                results.push({
                    machineNo: data.machineNo,
                    big: data.big,
                    reg: data.reg,
                    games: data.games,
                    maxPayout: data.maxPayout,
                    screenshotPath: null,
                })
                const maxStr = data.maxPayout !== null ? `Max=${data.maxPayout}` : ''
                console.log(
                    `  No.${data.machineNo}: BIG=${data.big} REG=${data.reg} G=${data.games} ${maxStr}`
                )
            }
        } else {
            console.log('\n  テーブルデータが取得できませんでした。')
            console.log(`  ページテキスト (先頭1500文字):\n${extractedData.debugText}`)

            // Still create entries for all machines in range even if no data
            for (let no = rangeStart; no <= rangeEnd; no++) {
                results.push({
                    machineNo: no,
                    big: 0,
                    reg: 0,
                    games: 0,
                    maxPayout: null,
                    screenshotPath: null,
                })
            }
        }

        // Step 3: Take element-level screenshots of each machine's graph card
        // Individual detail pages are blocked (error 451), so capture graphs from list page.
        console.log(`[3/3] グラフSS取得中...`)

        // Find all machine card/graph elements on the list page
        const cardScreenshots = await page.evaluate(
            (range: { start: number; end: number }) => {
                const found: Array<{ machineNo: number; selector: string }> = []

                // Search for elements containing machine numbers and nearby graphs
                const allElements = document.querySelectorAll('*')
                for (const el of allElements) {
                    // Look for台番号 text nodes
                    const text = (el as HTMLElement).textContent || ''
                    const noMatch = text.match(/^0(\d{3})$/)
                    if (noMatch) {
                        const no = parseInt(noMatch[1])
                        if (no >= range.start && no <= range.end) {
                            // Walk up to find the parent card/container
                            let container: HTMLElement | null = el as HTMLElement
                            for (let i = 0; i < 5; i++) {
                                if (container?.parentElement) {
                                    container = container.parentElement
                                    const rect = container.getBoundingClientRect()
                                    // A card container should have reasonable size
                                    if (rect.width > 100 && rect.height > 100) {
                                        // Add unique ID for selector
                                        const id = `card-${no}`
                                        container.id = id
                                        found.push({ machineNo: no, selector: `#${id}` })
                                        break
                                    }
                                }
                            }
                        }
                    }
                }

                return found
            },
            { start: rangeStart, end: rangeEnd }
        )

        console.log(`  検出されたカード要素: ${cardScreenshots.length}件`)

        for (const card of cardScreenshots) {
            try {
                const el = page.locator(card.selector)
                if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
                    const ssFilename = `graph_no${card.machineNo}.png`
                    const ssPath = pathModule.join(ssDir, ssFilename)
                    await el.screenshot({ path: ssPath })
                    console.log(`    No.${card.machineNo}: グラフSS保存: ${ssFilename}`)

                    const record = results.find((r) => r.machineNo === card.machineNo)
                    if (record) {
                        record.screenshotPath = ssPath
                    }
                }
            } catch (e: any) {
                console.error(`    No.${card.machineNo}: SS取得エラー - ${e.message}`)
            }
        }

        // If element-level didn't work, fall back to full page SS
        if (cardScreenshots.length === 0) {
            console.log('  カード要素が見つかりません。フルページSSを保存します。')
            await page.screenshot({
                path: pathModule.join(ssDir, 'fullpage_data.png'),
                fullPage: true,
            })
        }

        // Also capture the "詳細グラフ" view if available
        console.log(`  詳細グラフビュー取得中...`)
        try {
            const graphLink = page.locator('text=詳細グラフ').first()
            if (await graphLink.isVisible({ timeout: 3000 }).catch(() => false)) {
                await graphLink.click()
                await page.waitForTimeout(5000)
                await page.screenshot({
                    path: pathModule.join(ssDir, 'detail_graph.png'),
                    fullPage: true,
                })
                console.log(`  詳細グラフSS保存: detail_graph.png`)
            } else {
                console.log(`  詳細グラフリンクが見つかりません`)
            }
        } catch (e: any) {
            console.error(`  詳細グラフ取得エラー: ${e.message}`)
        }
    } catch (e: any) {
        console.error(`Fatal error: ${e.message}`)
        await page
            .screenshot({
                path: pathModule.join(ssDir, 'debug_fatal.png'),
                fullPage: true,
            })
            .catch(() => {})
    } finally {
        await browser.close()
    }

    return results
}

// === Markdown Output ===
function outputMarkdown(records: MachineRecord[], dateStr: string): string {
    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    const outputDir = pathModule.join(__dirname, '..', 'data', 'fetched')
    const outputPath = pathModule.join(
        outputDir,
        `${dateStr}_${CONFIG.machineName}.md`
    )

    let md = `# ${CONFIG.machineName} ${dateStr}\n`
    md += `店舗: ${CONFIG.storeName} | 取得: ${now}\n\n`
    md += `| 台番号 | G数 | BIG | REG | 最大放出 | 差枚(確定) | 備考 |\n`
    md += `|:---:|:---:|:---:|:---:|:---:|:---:|:---|\n`

    for (const r of records) {
        const maxPayout = r.maxPayout !== null ? String(r.maxPayout) : '-'
        const note =
            r.games === 0
                ? '未稼働'
                : r.screenshotPath
                  ? 'SS有'
                  : ''

        if (r.games > 0) {
            md += `| ${r.machineNo} | ${r.games} | ${r.big} | ${r.reg} | ${maxPayout} |  | ${note} |\n`
        } else {
            md += `| ${r.machineNo} | - | - | - | - |  | ${note} |\n`
        }
    }

    md += `\n## スクリーンショット（グラフ要素）\n`
    const ssDir = `${dateStr}_${CONFIG.machineName}_ss`
    for (const r of records) {
        if (r.screenshotPath) {
            md += `- No.${r.machineNo}: \`data/fetched/${ssDir}/graph_no${r.machineNo}.png\`\n`
        }
    }

    md += `\n## ステータス\n`
    md += `- [x] 取得完了 (${now})\n`
    md += `- [ ] 差枚入力済み\n`
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

    console.log(`=== カバネリ海門XX データ取得 ===`)
    console.log(`機種: ${CONFIG.machineName}`)
    console.log(`日付: ${targetDate}`)
    console.log(`店舗: ${CONFIG.storeName}`)
    console.log(`台番号: ${CONFIG.machineNoRange.start}〜${CONFIG.machineNoRange.end}`)
    console.log(`==============================\n`)

    const records = await fetchData(targetDate)

    const outputPath = outputMarkdown(records, targetDate)

    // Summary
    console.log(`\n=== サマリー ===`)
    console.log(`取得台数: ${records.length}`)
    const activeRecords = records.filter((r) => r.games > 0)
    console.log(`稼働台: ${activeRecords.length} / ${records.length}`)
    const ssCount = records.filter((r) => r.screenshotPath).length
    console.log(`SS取得: ${ssCount}台`)
    console.log(
        `\n次のステップ: Markdown の「差枚(確定)」列にユーザー提供の差枚数を入力 → DB登録`
    )
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
