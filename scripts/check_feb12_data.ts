
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const dbUrl = process.env.POSTGRES_PRISMA_URL || 'UNDEFINED'
    const maskedUrl = dbUrl.length > 20
        ? dbUrl.substring(0, 15) + '...' + dbUrl.substring(dbUrl.length - 5)
        : dbUrl
    console.log(`Connection URL: ${maskedUrl}`)

    console.log('検索対象日: 2026-02-12')

    const records = await prisma.record.findMany({
        where: {
            date: {
                gte: new Date('2026-02-12T00:00:00+09:00'),
                lte: new Date('2026-02-12T23:59:59+09:00')
            }
        },
        include: {
            machine: true
        },
        orderBy: {
            updatedAt: 'desc'
        }
    })

    console.log(`\n該当レコード数: ${records.length} 件`)

    if (records.length > 0) {
        console.log('--- 先頭5件のデータ ---')
        records.slice(0, 5).forEach(r => {
            console.log(`ID: ${r.id}`)
            console.log(`日付: ${r.date.toISOString()}`)
            console.log(`機種: ${r.machine.name} (No.${r.machineNo})`)
            console.log(`Updated: ${r.updatedAt.toISOString()}`)
        })
    } else {
        console.log('2月12日のデータは見つかりませんでした。')
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
