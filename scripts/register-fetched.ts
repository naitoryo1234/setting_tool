/**
 * 確認済みMarkdownファイルからDBに登録するスクリプト
 *
 * - 登録前にバックアップを自動取得
 * - 登録後にMarkdownのステータスを自動更新
 *
 * 使い方:
 *   npx ts-node scripts/register-fetched.ts --file=data/fetched/2026-02-28_北斗転生.md
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import { execSync } from 'child_process'
import minimist from 'minimist'

import { DEFAULT_STORE } from '../lib/pscube-config.ts'

const prisma = new PrismaClient()

interface ParsedRecord {
    machineNo: number
    games: number
    big: number
    reg: number
    diffCalc: number
    diffFinal: number | null // ユーザーが手動設定した差枚
}

/**
 * Markdownファイルをパースしてレコードを取得
 */
function parseMarkdown(filePath: string): { date: string; machineName: string; records: ParsedRecord[] } {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    // ヘッダーから機種名と日付を取得
    // Format: "# 北斗転生 2026-02-28"
    const headerMatch = lines[0]?.match(/^# (.+?) (\d{4}-\d{2}-\d{2})/)
    const machineName = headerMatch?.[1] || ''
    const date = headerMatch?.[2] || ''

    // テーブル行をパース
    const records: ParsedRecord[] = []
    const isKabaneri = machineName.includes('カバネリ')

    for (const line of lines) {
        if (isKabaneri) {
            // カバネリ用: | 台番号 | G数 | BIG | REG | 最大放出 | 差枚(確定) | 備考 |
            // 5列目(最大放出)はDBに保存しないため無視し、6列目を diffFinal として取得
            const match = line.match(/^\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([+-]?\d+)?\s*\|\s*([+-]?\d+)?\s*\|/)
            if (match) {
                records.push({
                    machineNo: parseInt(match[1]),
                    games: parseInt(match[2]),
                    big: parseInt(match[3]),
                    reg: parseInt(match[4]),
                    diffCalc: 0, // カバネリは計算不可
                    diffFinal: match[6]?.trim() ? parseInt(match[6]) : null,
                })
            }
        } else {
            // 北斗等通常用: | 台番号 | G数 | BIG | REG | 差枚(計算) | 差枚(確定) | 備考 |
            const match = line.match(/^\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([+-]?\d+)\s*\|\s*([+-]?\d+)?\s*\|/)
            if (match) {
                records.push({
                    machineNo: parseInt(match[1]),
                    games: parseInt(match[2]),
                    big: parseInt(match[3]),
                    reg: parseInt(match[4]),
                    diffCalc: parseInt(match[5]),
                    diffFinal: match[6]?.trim() ? parseInt(match[6]) : null,
                })
            }
        }
    }

    return { date, machineName, records }
}

/**
 * バックアップを実行
 */
function runBackup(): void {
    console.log('=== バックアップ実行中 ===')
    try {
        execSync('npm run backup', { stdio: 'inherit', cwd: process.cwd() })
        console.log('バックアップ完了\n')
    } catch (e: any) {
        console.error('バックアップに失敗しました:', e.message)
        throw new Error('バックアップ失敗のため登録を中止します')
    }
}

/**
 * Markdownファイルのステータスを更新
 */
function updateMarkdownStatus(filePath: string): void {
    let content = fs.readFileSync(filePath, 'utf-8')
    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })

    // 「DB登録済み」チェックボックスを更新
    content = content.replace(
        /- \[ \] DB登録済み/,
        `- [x] DB登録済み (${now})`
    )

    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`ステータス更新: ${filePath}`)
}

async function main() {
    const args = minimist(process.argv.slice(2))
    const filePath = args['file']

    if (!filePath) {
        console.error('Usage: npx ts-node scripts/register-fetched.ts --file=data/fetched/YYYY-MM-DD_機種名.md')
        process.exit(1)
    }

    if (!fs.existsSync(filePath)) {
        console.error(`ファイルが見つかりません: ${filePath}`)
        process.exit(1)
    }

    // Markdownをパース
    const { date, machineName, records } = parseMarkdown(filePath)
    console.log(`機種: ${machineName}`)
    console.log(`日付: ${date}`)
    console.log(`レコード数: ${records.length}`)

    if (!date || records.length === 0) {
        console.error('ファイルのパースに失敗しました')
        process.exit(1)
    }

    // バックアップを自動実行
    runBackup()

    // DB上の機種を検索
    const machine = await prisma.machine.findFirst({
        where: { name: { contains: machineName } },
    })
    if (!machine) {
        console.error(`機種 "${machineName}" がDBに見つかりません`)
        process.exit(1)
    }

    // 機種設定からseasonを取得（見つからない場合はデフォルトで1とする）
    const machineConfig = DEFAULT_STORE.machines.find((m: any) => machineName.includes(m.dbName) || machineName.includes(m.searchName))
    const season = machineConfig?.season || 1

    console.log(`DB機種: ${machine.name} (${machine.id}), Season: ${season}\n`)

    const targetDate = new Date(`${date}T00:00:00+09:00`)

    // 登録
    for (const r of records) {
        // 差枚(確定)があればそちらを使用、なければ計算値
        const diff = r.diffFinal !== null ? r.diffFinal : r.diffCalc

        // MachineNumber の UPSERT も連動して行う（既存に無い台番の場合に自動生成するため）
        await prisma.machineNumber.upsert({
            where: {
                machineId_machineNo_season: {
                    machineId: machine.id,
                    machineNo: r.machineNo,
                    season: season,
                }
            },
            update: {},
            create: {
                machineId: machine.id,
                machineNo: r.machineNo,
                season: season,
            }
        })

        await prisma.record.upsert({
            where: {
                date_machineId_machineNo_season: {
                    date: targetDate,
                    machineId: machine.id,
                    machineNo: r.machineNo,
                    season: season,
                },
            },
            update: { diff, games: r.games, big: r.big, reg: r.reg },
            create: {
                date: targetDate,
                machineId: machine.id,
                machineNo: r.machineNo,
                season: season,
                diff,
                games: r.games,
                big: r.big,
                reg: r.reg,
            },
        })

        const source = r.diffFinal !== null ? '確定' : '計算'
        console.log(`No.${r.machineNo}: Diff ${diff} (${source}), G ${r.games}`)
    }

    console.log(`\n${records.length}件のレコードを登録しました。`)

    // ステータスを更新
    updateMarkdownStatus(filePath)
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
