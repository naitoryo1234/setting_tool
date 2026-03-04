import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const records = await prisma.record.findMany({
        select: { date: true }
    })
    const dates = new Set(records.map(r => r.date.toISOString().split('T')[0]))
    console.log(Array.from(dates).sort().reverse().slice(0, 10))
}

main().finally(() => prisma.$disconnect())
