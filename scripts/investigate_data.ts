
import { PrismaClient } from '@prisma/client'
import minimist from 'minimist'

const prisma = new PrismaClient()

async function main() {
    const args = minimist(process.argv.slice(2))
    const doDelete = args['delete']

    console.log('検索対象期間: 2026-02-15 〜 2026-02-26')

    // マギレコのMachine IDを取得（名前で検索）
    const machines = await prisma.machine.findMany({
        where: {
            name: {
                contains: 'マギ', // "マギレコ"が含まれるか確認
            }
        }
    })

    if (machines.length === 0) {
        console.log('「マギ」を含む機種が見つかりませんでした。')
        return
    }

    const machineIds = machines.map(m => m.id)

    const records = await prisma.record.findMany({
        where: {
            machineId: {
                in: machineIds
            },
            date: {
                gte: new Date('2026-02-15T00:00:00+09:00'),
                lte: new Date('2026-02-26T23:59:59+09:00')
            }
        },
        include: {
            machine: true
        }
    })

    console.log(`\n該当レコード数: ${records.length} 件`)

    if (records.length > 0) {
        if (doDelete) {
            console.log('\n--- 削除処理開始 ---')
            const deleted = await prisma.record.deleteMany({
                where: {
                    id: { in: records.map(r => r.id) }
                }
            })
            console.log(`${deleted.count} 件のレコードを削除しました。`)
        } else {
            console.log('--- 先頭5件のデータ ---')
            records.slice(0, 5).forEach(r => {
                console.log(`ID: ${r.id}`)
                console.log(`日付: ${r.date.toISOString()}`)
                console.log(`機種: ${r.machine.name} (No.${r.machineNo})`)
                console.log(`差枚: ${r.diff}`)
                console.log(`作成日時(createdAt): ${r.createdAt.toISOString()}`)
                console.log('---------------------------')
            })
            console.log('\n※削除するには "npx ts-node scripts/investigate_data.ts --delete" を実行してください。')
        }
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
