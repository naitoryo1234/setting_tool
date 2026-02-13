
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('検索対象日: 2026-02-11 〜 2026-02-12')

    const records = await prisma.record.findMany({
        where: {
            date: {
                gte: new Date('2026-02-11T00:00:00+09:00'),
                lte: new Date('2026-02-12T23:59:59+09:00')
            }
        },
        include: {
            machine: true
        },
        orderBy: {
            date: 'desc'
        }
    })

    console.log(`\n該当レコード数: ${records.length} 件`)

    if (records.length > 0) {
        // 機種ごとのカウント
        const counts: Record<string, number> = {}
        records.forEach(r => {
            counts[r.machine.name] = (counts[r.machine.name] || 0) + 1
        })
        console.log('機種別件数:', counts)

        console.log('--- 先頭5件のデータ ---')
        records.slice(0, 5).forEach(r => {
            console.log(`日付: ${r.date.toISOString()}`)
            console.log(`機種: ${r.machine.name} (No.${r.machineNo})`)
            console.log(`差枚: ${r.diff}`)
            console.log('---------------------------')
        })
    } else {
        console.log('データが見つかりませんでした。')
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
