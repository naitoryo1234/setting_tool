
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Searching for Hokuto Tensei machine...')
    const machine = await prisma.machine.findFirst({
        where: { name: { contains: '北斗転生' } },
    })

    if (!machine) {
        console.error('Machine not found!')
        return
    }

    console.log(`Found machine: ${machine.name} (ID: ${machine.id})`)

    // Formula: Diff = (BIG * 134) - (Games * 1.52)
    const calc = (big: number, games: number) => Math.round((big * 134) - (games * 1.52))

    const records = [
        { machineNo: 238, games: 2817, big: 25, reg: 7, diff: calc(25, 2817) },
        { machineNo: 239, games: 515, big: 3, reg: 1, diff: calc(3, 515) },
        { machineNo: 240, games: 1583, big: 5, reg: 2, diff: calc(5, 1583) },
        { machineNo: 241, games: 1164, big: 33, reg: 3, diff: 3000 },           // User specified
        { machineNo: 242, games: 1018, big: 13, reg: 4, diff: calc(13, 1018) },
        { machineNo: 243, games: 1820, big: 15, reg: 5, diff: calc(15, 1820) },
        { machineNo: 244, games: 2371, big: 33, reg: 8, diff: calc(33, 2371) },
        { machineNo: 245, games: 503, big: 4, reg: 1, diff: calc(4, 503) },
        { machineNo: 246, games: 999, big: 9, reg: 2, diff: calc(9, 999) },
        { machineNo: 247, games: 641, big: 4, reg: 1, diff: calc(4, 641) },
        { machineNo: 248, games: 1810, big: 73, reg: 4, diff: 7200 },           // User specified
        { machineNo: 249, games: 761, big: 6, reg: 1, diff: calc(6, 761) },
        { machineNo: 250, games: 2315, big: 15, reg: 7, diff: calc(15, 2315) },
    ]

    const targetDate = new Date('2026-02-17T00:00:00+09:00')
    console.log(`Registering records for date: ${targetDate.toISOString()}`)

    for (const record of records) {
        await prisma.record.upsert({
            where: {
                date_machineId_machineNo: {
                    date: targetDate,
                    machineId: machine.id,
                    machineNo: record.machineNo,
                },
            },
            update: { diff: record.diff, games: record.games, big: record.big, reg: record.reg },
            create: {
                date: targetDate, machineId: machine.id, machineNo: record.machineNo,
                diff: record.diff, games: record.games, big: record.big, reg: record.reg,
            },
        })
        console.log(`Registered No.${record.machineNo}: Diff ${record.diff}, G ${record.games}`)
    }

    console.log('Done! All Feb 17 records registered.')
}

main()
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
