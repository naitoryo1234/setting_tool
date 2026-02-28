
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
        { machineNo: 238, games: 2860, big: 18, reg: 8, diff: calc(18, 2860) },  // -1935
        { machineNo: 239, games: 4132, big: 34, reg: 13, diff: calc(34, 4132) },  // -1725
        { machineNo: 240, games: 1057, big: 23, reg: 2, diff: calc(23, 1057) },  // +1475
        { machineNo: 241, games: 2761, big: 21, reg: 7, diff: calc(21, 2761) },  // -1383
        { machineNo: 242, games: 3447, big: 42, reg: 11, diff: calc(42, 3447) },  // +389
        { machineNo: 243, games: 1318, big: 6, reg: 3, diff: calc(6, 1318) },   // -1199
        { machineNo: 244, games: 1538, big: 7, reg: 3, diff: calc(7, 1538) },   // -1400
        { machineNo: 245, games: 1221, big: 5, reg: 2, diff: calc(5, 1221) },   // -1186
        { machineNo: 246, games: 2745, big: 38, reg: 6, diff: calc(38, 2745) },  // +920
        { machineNo: 247, games: 2840, big: 25, reg: 11, diff: calc(25, 2840) },  // -967
        { machineNo: 248, games: 1894, big: 27, reg: 5, diff: calc(27, 1894) },  // +739
        { machineNo: 249, games: 590, big: 2, reg: 2, diff: calc(2, 590) },    // -629
        { machineNo: 250, games: 3316, big: 79, reg: 11, diff: calc(79, 3316) },  // +5546
    ]

    const targetDate = new Date('2026-02-25T00:00:00+09:00')
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
