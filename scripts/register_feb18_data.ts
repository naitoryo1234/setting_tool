
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

    // Formula: Diff = (BIG * 134) - (Games * 1.52)
    const calc = (big: number, games: number) => Math.round((big * 134) - (games * 1.52))

    const records = [
        { machineNo: 238, games: 1163, big: 16, reg: 4, diff: calc(16, 1163) }, // +376
        { machineNo: 239, games: 677, big: 28, reg: 3, diff: 1400 },            // User specified (+1400) vs Calc (+2723)
        { machineNo: 240, games: 1129, big: 8, reg: 4, diff: calc(8, 1129) },   // -644
        { machineNo: 241, games: 273, big: 4, reg: 1, diff: calc(4, 273) },     // +121
        { machineNo: 242, games: 1282, big: 10, reg: 2, diff: calc(10, 1282) }, // -609
        { machineNo: 243, games: 685, big: 5, reg: 2, diff: calc(5, 685) },     // -371
        { machineNo: 244, games: 785, big: 33, reg: 4, diff: 4600 },            // User specified (+4600) vs Calc (+3229)
        { machineNo: 245, games: 3210, big: 52, reg: 17, diff: 1000 },          // User specified (+1000) vs Calc (+2089)
        { machineNo: 246, games: 675, big: 24, reg: 4, diff: 2200 },            // User specified (+2200) vs Calc (+2190)
        { machineNo: 247, games: 300, big: 2, reg: 1, diff: calc(2, 300) },     // -188
        { machineNo: 248, games: 4199, big: 43, reg: 10, diff: calc(43, 4199) },// -620
        { machineNo: 249, games: 1342, big: 8, reg: 4, diff: calc(8, 1342) },   // -968
        { machineNo: 250, games: 3413, big: 41, reg: 12, diff: 700 },           // User specified (+700) vs Calc (+306)
    ]

    const targetDate = new Date('2026-02-18T00:00:00+09:00') // JST
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
            update: {
                diff: record.diff,
                games: record.games,
                big: record.big,
                reg: record.reg,
            },
            create: {
                date: targetDate,
                machineId: machine.id,
                machineNo: record.machineNo,
                diff: record.diff,
                games: record.games,
                big: record.big,
                reg: record.reg,
            },
        })
        console.log(`Registered No.${record.machineNo}: Diff ${record.diff}, G ${record.games}`)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
