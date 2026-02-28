
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const machine = await prisma.machine.findFirst({
        where: { name: { contains: '北斗転生' } },
    })
    if (!machine) { console.error('Machine not found!'); return }
    console.log(`Found: ${machine.name} (${machine.id})`)

    const calc = (big: number, games: number) => Math.round((big * 134) - (games * 1.52))

    const records = [
        { machineNo: 238, games: 7263, big: 90, reg: 22, diff: calc(90, 7263) },  // +1020
        { machineNo: 239, games: 1277, big: 12, reg: 5, diff: calc(12, 1277) },  // -333
        { machineNo: 240, games: 2891, big: 21, reg: 9, diff: calc(21, 2891) },  // -1580
        { machineNo: 241, games: 2314, big: 22, reg: 8, diff: calc(22, 2314) },  // -569
        { machineNo: 242, games: 3846, big: 37, reg: 12, diff: calc(37, 3846) },  // -888
        { machineNo: 243, games: 5515, big: 49, reg: 20, diff: calc(49, 5515) },  // -1817
        { machineNo: 244, games: 3619, big: 16, reg: 8, diff: calc(16, 3619) },  // -3357
        { machineNo: 245, games: 6341, big: 52, reg: 19, diff: calc(52, 6341) },  // -2670
        { machineNo: 246, games: 2325, big: 8, reg: 6, diff: calc(8, 2325) },   // -2462
        { machineNo: 247, games: 1826, big: 23, reg: 4, diff: calc(23, 1826) },  // +306
        { machineNo: 248, games: 1550, big: 11, reg: 5, diff: calc(11, 1550) },  // -882
        { machineNo: 249, games: 4967, big: 51, reg: 16, diff: calc(51, 4967) },  // -716
        { machineNo: 250, games: 1602, big: 12, reg: 3, diff: calc(12, 1602) },  // -827
    ]

    const targetDate = new Date('2026-02-26T00:00:00+09:00')
    console.log(`Registering for: ${targetDate.toISOString()}`)

    for (const r of records) {
        await prisma.record.upsert({
            where: {
                date_machineId_machineNo: {
                    date: targetDate, machineId: machine.id, machineNo: r.machineNo,
                },
            },
            update: { diff: r.diff, games: r.games, big: r.big, reg: r.reg },
            create: {
                date: targetDate, machineId: machine.id, machineNo: r.machineNo,
                diff: r.diff, games: r.games, big: r.big, reg: r.reg,
            },
        })
        console.log(`No.${r.machineNo}: Diff ${r.diff}, G ${r.games}, BIG ${r.big}`)
    }
    console.log('Done!')
}

main()
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
