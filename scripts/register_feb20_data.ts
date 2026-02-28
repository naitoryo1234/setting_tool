
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
        { machineNo: 238, games: 2083, big: 5, reg: 3, diff: calc(5, 2083) },   // -2496
        { machineNo: 239, games: 1572, big: 31, reg: 6, diff: 2000 },            // User specified
        { machineNo: 240, games: 128, big: 1, reg: 1, diff: calc(1, 128) },    // -61
        { machineNo: 241, games: 1180, big: 47, reg: 4, diff: 6500 },            // User specified
        { machineNo: 242, games: 704, big: 4, reg: 1, diff: calc(4, 704) },    // -534
        { machineNo: 243, games: 2320, big: 27, reg: 7, diff: calc(27, 2320) },  // +92
        { machineNo: 244, games: 1701, big: 19, reg: 4, diff: calc(19, 1701) },  // -40
        { machineNo: 245, games: 1155, big: 4, reg: 3, diff: calc(4, 1155) },   // -1220
        { machineNo: 246, games: 2211, big: 22, reg: 6, diff: calc(22, 2211) },  // -413
        { machineNo: 247, games: 1580, big: 12, reg: 4, diff: calc(12, 1580) },  // -794
        { machineNo: 248, games: 2934, big: 58, reg: 6, diff: 3000 },            // User specified
        { machineNo: 249, games: 580, big: 3, reg: 1, diff: calc(3, 580) },    // -480
        { machineNo: 250, games: 2884, big: 33, reg: 7, diff: calc(33, 2884) },  // +38
    ]

    const targetDate = new Date('2026-02-20T00:00:00+09:00')
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
