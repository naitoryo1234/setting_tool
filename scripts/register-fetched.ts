/**
 * 確認済みMarkdownファイルからDBに登録するスクリプト
 *
 * 使い方:
 *   npx ts-node scripts/register-fetched.ts --file=data/fetched/2026-02-28_北斗転生.md
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import minimist from 'minimist'

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
    for (const line of lines) {
        // "| 238 | 2817 | 25 | 7 | -932 | +1000 | 備考 |" のような行
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

    return { date, machineName, records }
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

    // DB上の機種を検索
    const machine = await prisma.machine.findFirst({
        where: { name: { contains: machineName } },
    })
    if (!machine) {
        console.error(`機種 "${machineName}" がDBに見つかりません`)
        process.exit(1)
    }

    console.log(`DB機種: ${machine.name} (${machine.id})\n`)

    const targetDate = new Date(`${date}T00:00:00+09:00`)

    // 登録
    for (const r of records) {
        // 差枚(確定)があればそちらを使用、なければ計算値
        const diff = r.diffFinal !== null ? r.diffFinal : r.diffCalc

        await prisma.record.upsert({
            where: {
                date_machineId_machineNo: {
                    date: targetDate,
                    machineId: machine.id,
                    machineNo: r.machineNo,
                },
            },
            update: { diff, games: r.games, big: r.big, reg: r.reg },
            create: {
                date: targetDate,
                machineId: machine.id,
                machineNo: r.machineNo,
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
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
