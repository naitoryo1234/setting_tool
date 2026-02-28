const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    // すべての日付のレコード件数
    const dates = await prisma.record.groupBy({
        by: ['date'],
        _count: { id: true },
        orderBy: { date: 'desc' },
    })
    for (const d of dates) {
        const jst = new Date(d.date.getTime() + 9 * 60 * 60 * 1000)
        const jstStr = jst.toISOString().split('T')[0]
        console.log(`JST ${jstStr} (UTC: ${d.date.toISOString()}): ${d._count.id} records`)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
