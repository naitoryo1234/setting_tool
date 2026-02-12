import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Migrating existing records to MachineNumber...')

    // Get all unique (machineId, machineNo) from records
    const records = await prisma.record.findMany({
        select: {
            machineId: true,
            machineNo: true,
        },
        distinct: ['machineId', 'machineNo'],
    })

    console.log(`Found ${records.length} unique machine numbers.`)

    let count = 0
    for (const r of records) {
        try {
            await prisma.machineNumber.upsert({
                where: {
                    machineId_machineNo: {
                        machineId: r.machineId,
                        machineNo: r.machineNo,
                    },
                },
                update: {},
                create: {
                    machineId: r.machineId,
                    machineNo: r.machineNo,
                },
            })
            count++
        } catch (e) {
            console.error(`Failed to migrate ${r.machineId}-${r.machineNo}`, e)
        }
    }

    console.log(`Successfully migrated ${count} numbers.`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
