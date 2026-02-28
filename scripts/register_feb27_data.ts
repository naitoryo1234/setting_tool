
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
        { machineNo: 238, games: 4228, big: 33, reg: 8, diff: calc(33, 4228) },  // -2005
        { machineNo: 239, games: 3150, big: 36, reg: 8, diff: calc(36, 3150) },  // +36
        { machineNo: 240, games: 817, big: 7, reg: 2, diff: calc(7, 817) },    // -304
        { machineNo: 241, games: 2967, big: 23, reg: 10, diff: calc(23, 2967) },  // -1428
        { machineNo: 242, games: 4264, big: 48, reg: 14, diff: calc(48, 4264) },  // -49
        { machineNo: 243, games: 2066, big: 11, reg: 3, diff: calc(11, 2066) },  // -1666
        { machineNo: 244, games: 1034, big: 7, reg: 2, diff: calc(7, 1034) },   // -634
        { machineNo: 245, games: 5532, big: 40, reg: 15, diff: calc(40, 5532) },  // -3049
        { machineNo: 246, games: 2705, big: 21, reg: 6, diff: calc(21, 2705) },  // -1298
        { machineNo: 247, games: 1383, big: 6, reg: 3, diff: calc(6, 1383) },   // -1298
        { machineNo: 248, games: 866, big: 9, reg: 3, diff: calc(9, 866) },    // -110
        { machineNo: 249, games: 4903, big: 30, reg: 10, diff: calc(30, 4903) },  // -3432
        { machineNo: 250, games: 3251, big: 21, reg: 7, diff: calc(21, 3251) },  // -2127
    ]

    const targetDate = new Date('2026-02-27T00:00:00+09:00')
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
