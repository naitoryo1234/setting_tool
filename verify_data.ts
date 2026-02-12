import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const startDate = new Date('2026-02-09')
    const endDate = new Date('2026-02-11')

    const machines = [
        'マギレコ',
        '北斗転生',
        '化物語',
        '炎炎2',
    ]

    console.log('--- Data Verification ---')

    for (const machineName of machines) {
        console.log(`\n### ${machineName}`)
        const machine = await prisma.machine.findUnique({ where: { name: machineName } })
        if (!machine) {
            console.log('Machine not found')
            continue
        }

        const records = await prisma.record.findMany({
            where: {
                machineId: machine.id,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: [
                { machineNo: 'asc' },
                { date: 'asc' },
            ],
        })

        // Group by machineNo
        const byMachineNo: Record<number, number[]> = {}
        records.forEach(r => {
            if (!byMachineNo[r.machineNo]) byMachineNo[r.machineNo] = []
            byMachineNo[r.machineNo].push(r.diff)
        })

        for (const [no, diffs] of Object.entries(byMachineNo)) {
            console.log(`${no} ${diffs.join(' ')}`)
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
