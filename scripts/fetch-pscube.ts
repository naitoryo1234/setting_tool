/**
 * P's CUBE データ自動取得スクリプト
 *
 * 使い方:
 *   npx ts-node scripts/fetch-pscube.ts --machine=北斗転生
 *   npx ts-node scripts/fetch-pscube.ts --machine=北斗転生 --days-ago=1
 *
 * 出力:
 *   data/fetched/YYYY-MM-DD_機種名.md
 */

import { chromium } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'
import minimist from 'minimist'
import { DEFAULT_STORE, calculateDiff, MachineConfig } from '../lib/pscube-config'

interface FetchedRecord {
    machineNo: number
    big: number
    reg: number
    games: number
    diffCalc: number // 計算式による推定差枚
}

async function fetchPsCubeData(
    machineConfig: MachineConfig,
    daysAgo: number = 0
): Promise<FetchedRecord[]> {
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
        viewport: { width: 1024, height: 768 },
    })
    const page = await context.newPage()
    const results: FetchedRecord[] = []

    try {
        // 1. 機種一覧ページにアクセス
        const listUrl = `${DEFAULT_STORE.baseUrl}/nc-v03-001.php?cd_ps=2&bai=21.7391`
        console.log(`Accessing: ${listUrl}`)
        await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 })
        await page.waitForTimeout(2000) // JS描画待ち

        // 2. 機種名で検索
        console.log(`Searching for: ${machineConfig.searchName}`)

        // 検索フィールドに入力
        const searchInput = page.locator('input[type="text"], input[placeholder*="機種名"]').first()
        await searchInput.fill(machineConfig.searchName)
        await page.waitForTimeout(500)

        // 検索ボタンをクリック
        const searchButton = page.locator('button:has(svg), .btn-search, [type="submit"]').first()
        await searchButton.click()
        await page.waitForTimeout(3000) // 検索結果の描画待ち

        // 3. 検索結果から対象機種を探してクリック
        // 「転生」を含むリンクを探す
        const machineLink = page.locator(`a:has-text("転生"), a:has-text("${machineConfig.dbName}")`).first()
        if (await machineLink.isVisible()) {
            await machineLink.click()
            await page.waitForTimeout(3000)
        } else {
            console.error('機種が見つかりませんでした。ページ内リンクを探索します...')
            // フォールバック: 全リンクから探す
            const links = await page.locator('a').all()
            for (const link of links) {
                const text = await link.textContent()
                if (text && (text.includes('転生') || text.includes('北斗'))) {
                    console.log(`Found link: ${text}`)
                    await link.click()
                    await page.waitForTimeout(3000)
                    break
                }
            }
        }

        // 4. 過去データへの切り替え（n日前ボタン）
        if (daysAgo > 0) {
            console.log(`Switching to ${daysAgo} day(s) ago...`)
            const dayButton = page.locator(`text="${daysAgo}日前"`).first()
            if (await dayButton.isVisible()) {
                await dayButton.click()
                await page.waitForTimeout(3000)
            }
        }

        // 5. 各台番号のデータを取得
        console.log('Extracting machine data...')
        const { start, end } = machineConfig.machineNoRange

        for (let no = start; no <= end; no++) {
            try {
                // 台番号のリンクまたはセルを探す
                const noStr = String(no).padStart(4, '0')
                const noCell = page.locator(`text="${noStr}", text="${no}"`).first()

                if (await noCell.isVisible({ timeout: 1000 })) {
                    // 台番号の行からデータを取得
                    const row = noCell.locator('..')
                    const cells = await row.locator('td, span, div').allTextContents()

                    // テーブルからBIG/REG/G数を抽出（セル構造に依存）
                    let big = 0, reg = 0, games = 0
                    for (const cell of cells) {
                        const trimmed = cell.trim()
                        // 数値のみのセルをパース（位置ベースで判定）
                        if (/^\d+$/.test(trimmed)) {
                            const num = parseInt(trimmed)
                            if (num === no || num === parseInt(noStr)) continue
                        }
                    }

                    // 個別ページにアクセスして確実にデータを取得
                    await noCell.click()
                    await page.waitForTimeout(2000)

                    // 個別ページからデータ読み取り
                    const pageText = await page.textContent('body') || ''

                    // BIG, REG, 累計ゲーム を正規表現で抽出
                    const bigMatch = pageText.match(/BIG\s*(\d+)/)
                    const regMatch = pageText.match(/REG\s*(\d+)/)
                    const gamesMatch = pageText.match(/累計ゲーム\s*(\d+)/)

                    big = bigMatch ? parseInt(bigMatch[1]) : 0
                    reg = regMatch ? parseInt(regMatch[1]) : 0
                    games = gamesMatch ? parseInt(gamesMatch[1]) : 0

                    if (games > 0) {
                        const diffCalc = calculateDiff(big, games, machineConfig.diffCalc)
                        results.push({ machineNo: no, big, reg, games, diffCalc })
                        console.log(`  No.${no}: BIG=${big} REG=${reg} G=${games} Diff=${diffCalc}`)
                    } else {
                        console.log(`  No.${no}: データなし（未稼働?）`)
                    }

                    // 一覧に戻る
                    await page.goBack()
                    await page.waitForTimeout(2000)
                } else {
                    console.log(`  No.${no}: 見つかりません`)
                }
            } catch (e: any) {
                console.error(`  No.${no}: 取得エラー - ${e.message}`)
            }
        }

    } catch (e: any) {
        console.error(`Fatal error: ${e.message}`)

        // デバッグ用スクリーンショット保存
        const debugPath = path.join(__dirname, '..', 'data', 'fetched', 'debug_screenshot.png')
        await page.screenshot({ path: debugPath, fullPage: true })
        console.log(`Debug screenshot saved: ${debugPath}`)
    } finally {
        await browser.close()
    }

    return results
}

/**
 * 一括取得: テーブルから全台データを一度に読み取る（高速版）
 */
async function fetchAllFromTable(
    machineConfig: MachineConfig,
    daysAgo: number = 0
): Promise<FetchedRecord[]> {
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
        viewport: { width: 1024, height: 768 },
    })
    const page = await context.newPage()
    const results: FetchedRecord[] = []

    try {
        // 1. 機種一覧ページにアクセス
        const listUrl = `${DEFAULT_STORE.baseUrl}/nc-v03-001.php?cd_ps=2&bai=21.7391`
        console.log(`Accessing: ${listUrl}`)
        await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 })
        await page.waitForTimeout(3000)

        // 2. 機種名で検索（JavaScriptで入力）
        console.log(`Searching for: ${machineConfig.searchName}`)
        await page.evaluate((name: string) => {
            const inputs = document.querySelectorAll('input[type="text"]')
            inputs.forEach(input => {
                (input as HTMLInputElement).value = name
                input.dispatchEvent(new Event('input', { bubbles: true }))
            })
        }, machineConfig.searchName)
        await page.waitForTimeout(500)

        // 検索ボタンクリック
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button, [role="button"]')
            buttons.forEach(btn => {
                if (btn.querySelector('svg') || btn.textContent?.includes('検索')) {
                    (btn as HTMLElement).click()
                }
            })
        })
        await page.waitForTimeout(3000)

        // 3. 検索結果から対象機種をクリック
        const found = await page.evaluate((keyword: string) => {
            const links = document.querySelectorAll('a')
            for (const link of links) {
                if (link.textContent?.includes('転生')) {
                    (link as HTMLElement).click()
                    return true
                }
            }
            return false
        }, machineConfig.searchName)

        if (!found) {
            console.error('機種リンクが見つかりませんでした')
            // スクリーンショットを保存
            const debugDir = path.join(__dirname, '..', 'data', 'fetched')
            fs.mkdirSync(debugDir, { recursive: true })
            await page.screenshot({ path: path.join(debugDir, 'debug_search.png'), fullPage: true })
            await browser.close()
            return results
        }

        await page.waitForTimeout(3000)

        // 4. 過去データへの切り替え
        if (daysAgo > 0) {
            console.log(`Switching to ${daysAgo} day(s) ago...`)
            await page.evaluate((days: number) => {
                const buttons = document.querySelectorAll('button, a, [role="button"], span')
                for (const btn of buttons) {
                    if (btn.textContent?.trim() === `${days}日前`) {
                        (btn as HTMLElement).click()
                        return
                    }
                }
            }, daysAgo)
            await page.waitForTimeout(3000)
        }

        // 5. ページ全体のテキストからデータ抽出
        console.log('Extracting data from page...')

        // スクリーンショット保存（デバッグ用）
        const debugDir = path.join(__dirname, '..', 'data', 'fetched')
        fs.mkdirSync(debugDir, { recursive: true })
        await page.screenshot({ path: path.join(debugDir, 'debug_data_page.png'), fullPage: true })

        // HTML全体を取得して解析
        const pageContent = await page.content()
        const bodyText = await page.textContent('body') || ''

        // 各台番号のデータを抽出
        const { start, end } = machineConfig.machineNoRange

        // 個別台ページにアクセスしてデータ取得
        for (let no = start; no <= end; no++) {
            const noStr = String(no).padStart(4, '0')

            try {
                // 台番号をクリック
                const clicked = await page.evaluate((targetNo: string) => {
                    const elements = document.querySelectorAll('a, td, span, div')
                    for (const el of elements) {
                        const text = el.textContent?.trim()
                        if (text === targetNo || text === String(parseInt(targetNo))) {
                            (el as HTMLElement).click()
                            return true
                        }
                    }
                    return false
                }, noStr)

                if (!clicked) {
                    console.log(`  No.${no}: 台番号が見つかりません`)
                    continue
                }

                await page.waitForTimeout(2000)

                // 個別台ページのデータを取得
                const machineData = await page.evaluate(() => {
                    const text = document.body.textContent || ''
                    const bigMatch = text.match(/BIG\s*(\d+)/)
                    const regMatch = text.match(/REG\s*(\d+)/)
                    const gamesMatch = text.match(/累計ゲーム\s*(\d+)/)
                    return {
                        big: bigMatch ? parseInt(bigMatch[1]) : 0,
                        reg: regMatch ? parseInt(regMatch[1]) : 0,
                        games: gamesMatch ? parseInt(gamesMatch[1]) : 0,
                    }
                })

                if (machineData.games > 0) {
                    const diffCalc = calculateDiff(
                        machineData.big,
                        machineData.games,
                        machineConfig.diffCalc
                    )
                    results.push({
                        machineNo: no,
                        big: machineData.big,
                        reg: machineData.reg,
                        games: machineData.games,
                        diffCalc,
                    })
                    console.log(`  No.${no}: BIG=${machineData.big} REG=${machineData.reg} G=${machineData.games} Diff=${diffCalc}`)
                } else {
                    console.log(`  No.${no}: データなし`)
                }

                // 一覧に戻る
                await page.goBack()
                await page.waitForTimeout(1500)

            } catch (e: any) {
                console.log(`  No.${no}: エラー (${e.message})`)
                // エラー時はページをリロードして続行
                try {
                    await page.goBack()
                    await page.waitForTimeout(1500)
                } catch { }
            }
        }

    } catch (e: any) {
        console.error(`Fatal error: ${e.message}`)
        const debugDir = path.join(__dirname, '..', 'data', 'fetched')
        fs.mkdirSync(debugDir, { recursive: true })
        await page.screenshot({ path: path.join(debugDir, 'debug_fatal.png'), fullPage: true })
    } finally {
        await browser.close()
    }

    return results
}

/**
 * Markdown形式で出力
 */
function outputMarkdown(
    records: FetchedRecord[],
    machineName: string,
    dateStr: string,
    outputPath: string
): void {
    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })

    let md = `# ${machineName} ${dateStr}\n`
    md += `店舗: ${DEFAULT_STORE.name} | 取得: ${now}\n\n`
    md += `| 台番号 | G数 | BIG | REG | 差枚(計算) | 差枚(確定) | 備考 |\n`
    md += `|:---:|:---:|:---:|:---:|:---:|:---:|:---|\n`

    for (const r of records) {
        md += `| ${r.machineNo} | ${r.games} | ${r.big} | ${r.reg} | ${r.diffCalc > 0 ? '+' : ''}${r.diffCalc} | | |\n`
    }

    md += `\nステータス: [ ] 未確認\n`

    // ディレクトリ作成
    const dir = path.dirname(outputPath)
    fs.mkdirSync(dir, { recursive: true })

    // ファイル出力
    fs.writeFileSync(outputPath, md, 'utf-8')
    console.log(`\nOutput saved to: ${outputPath}`)
}

// === Main ===
async function main() {
    const args = minimist(process.argv.slice(2))
    const machineName = args['machine'] || '北斗転生'
    const daysAgo = parseInt(args['days-ago'] || '0')

    // 機種設定を検索
    const machineConfig = DEFAULT_STORE.machines.find(
        m => m.dbName.includes(machineName) || m.searchName.includes(machineName)
    )
    if (!machineConfig) {
        console.error(`機種 "${machineName}" が設定に見つかりません`)
        process.exit(1)
    }

    // 日付の計算
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - daysAgo)
    const dateStr = targetDate.toLocaleDateString('sv-SE') // YYYY-MM-DD

    console.log(`=== P's CUBE データ取得 ===`)
    console.log(`機種: ${machineConfig.dbName}`)
    console.log(`日付: ${dateStr} (${daysAgo}日前)`)
    console.log(`店舗: ${DEFAULT_STORE.name}`)
    console.log(`========================\n`)

    // データ取得
    const records = await fetchAllFromTable(machineConfig, daysAgo)

    if (records.length === 0) {
        console.error('\nデータが取得できませんでした。')
        console.log('debug_*.png を確認してください。')
        process.exit(1)
    }

    // データ出力
    const outputDir = path.join(__dirname, '..', 'data', 'fetched')
    const outputPath = path.join(outputDir, `${dateStr}_${machineConfig.dbName}.md`)
    outputMarkdown(records, machineConfig.dbName, dateStr, outputPath)

    // サマリー
    console.log(`\n=== サマリー ===`)
    console.log(`取得台数: ${records.length}`)
    const totalDiff = records.reduce((sum, r) => sum + r.diffCalc, 0)
    console.log(`合計差枚(計算): ${totalDiff > 0 ? '+' : ''}${totalDiff}`)
    const plusCount = records.filter(r => r.diffCalc > 0).length
    console.log(`プラス台: ${plusCount} / ${records.length}`)
}

main().catch(e => {
    console.error(e)
    process.exit(1)
})
