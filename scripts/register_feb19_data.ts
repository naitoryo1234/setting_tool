
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const machine = await prisma.machine.findFirst({
        where: { name: { contains: '北斗転生' } },
    })
    if (!machine) { console.error('Machine not found!'); return }
    console.log(`Found: ${machine.name} (${machine.id})`)

    // Formula: Diff = (BIG * 134) - (Games * 1.52)
    const calc = (big: number, games: number) => Math.round((big * 134) - (games * 1.52))

    const records = [
        { machineNo: 238, games: 4313, big: 9, reg: 5, diff: calc(9, 4313) },   // -5350
        { machineNo: 239, games: 1023, big: 6, reg: 1, diff: calc(6, 1023) },   // -751
        { machineNo: 240, games: 2240, big: 18, reg: 8, diff: calc(18, 2240) },  // -993
        { machineNo: 241, games: 7902, big: 92, reg: 29, diff: 400 },             // User specified
        { machineNo: 242, games: 2782, big: 9, reg: 4, diff: calc(9, 2782) },   // -3023
        { machineNo: 243, games: 1431, big: 4, reg: 2, diff: calc(4, 1431) },   // -1639
        { machineNo: 244, games: 2499, big: 6, reg: 3, diff: calc(6, 2499) },   // -2995
        { machineNo: 245, games: 1371, big: 5, reg: 3, diff: calc(5, 1371) },   // -1414
        { machineNo: 246, games: 1255, big: 14, reg: 2, diff: calc(14, 1255) },  // -32
        { machineNo: 247, games: 3127, big: 34, reg: 9, diff: calc(34, 3127) },  // -197
        { machineNo: 248, games: 2264, big: 47, reg: 8, diff: 2200 },            // User specified
        { machineNo: 249, games: 872, big: 3, reg: 1, diff: calc(3, 872) },    // -923
        { machineNo: 250, games: 5117, big: 52, reg: 11, diff: calc(52, 5117) },  // -810
    ]

    const targetDate = new Date('2026-02-19T00:00:00+09:00')
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
