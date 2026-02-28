
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
        { machineNo: 238, games: 5194, big: 93, reg: 21, diff: 4400 },            // User specified
        { machineNo: 239, games: 5077, big: 44, reg: 13, diff: calc(44, 5077) },  // -1821
        { machineNo: 240, games: 6370, big: 61, reg: 22, diff: calc(61, 6370) },  // -1509
        { machineNo: 241, games: 950, big: 10, reg: 2, diff: calc(10, 950) },   // -104
        { machineNo: 242, games: 5932, big: 94, reg: 19, diff: 7500 },            // User specified
        { machineNo: 243, games: 5066, big: 41, reg: 16, diff: calc(41, 5066) },  // -2206
        { machineNo: 244, games: 4139, big: 118, reg: 20, diff: 14500 },           // User specified
        { machineNo: 245, games: 1491, big: 6, reg: 2, diff: calc(6, 1491) },   // -1462
        { machineNo: 246, games: 2224, big: 15, reg: 6, diff: calc(15, 2224) },  // -1370
        { machineNo: 247, games: 4886, big: 60, reg: 11, diff: 1900 },            // User specified
        { machineNo: 248, games: 2966, big: 26, reg: 8, diff: calc(26, 2966) },  // -1024
        { machineNo: 249, games: 2256, big: 10, reg: 3, diff: calc(10, 2256) },  // -2089
        { machineNo: 250, games: 3942, big: 37, reg: 7, diff: calc(37, 3942) },  // -1034
    ]

    const targetDate = new Date('2026-02-21T00:00:00+09:00')
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
