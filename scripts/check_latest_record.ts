
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const latest = await prisma.record.findFirst({
        orderBy: { date: 'desc' },
        include: { machine: true }
    })
    if (latest) {
        console.log(`最新レコード: ${latest.date.toISOString()} (${latest.machine.name} No.${latest.machineNo})`)
    } else {
        console.log('レコードが存在しません。')
    }
}
main().finally(() => prisma.$disconnect())
