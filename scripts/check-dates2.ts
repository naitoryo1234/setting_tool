import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

async function main() {
    const records = await p.record.findMany({ select: { date: true }, take: 5, orderBy: { date: 'desc' } })
    records.forEach(r => console.log(r.date.toISOString()))
}

main().finally(() => p.$disconnect())
