
import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

async function restore() {
    const backupPath = path.join(process.cwd(), 'backup_data.json')

    try {
        const data = await fs.readFile(backupPath, 'utf-8')
        const backup = JSON.parse(data)

        console.log(`Reading backup version: ${backup.version || 1}`)

        // 1. Stores
        console.log('\nRestoring Stores...')
        for (const s of backup.stores || []) {
            await prisma.store.upsert({
                where: { id: s.id },
                update: {
                    name: s.name,
                    createdAt: s.createdAt,
                    updatedAt: s.updatedAt,
                },
                create: {
                    id: s.id,
                    name: s.name,
                    createdAt: s.createdAt,
                    updatedAt: s.updatedAt,
                }
            })
        }

        // 2. Machines & Numbers
        console.log('\nRestoring Machines...')
        for (const m of backup.machines || []) {
            await prisma.machine.upsert({
                where: { id: m.id },
                update: {
                    name: m.name,
                    storeId: m.storeId,
                    createdAt: m.createdAt,
                    updatedAt: m.updatedAt,
                },
                create: {
                    id: m.id,
                    name: m.name,
                    storeId: m.storeId,
                    createdAt: m.createdAt,
                    updatedAt: m.updatedAt,
                }
            })

            // Restore Numbers
            if (m.numbers && m.numbers.length > 0) {
                for (const n of m.numbers) {
                    await prisma.machineNumber.upsert({
                        where: { id: n.id },
                        update: {
                            machineId: n.machineId,
                            machineNo: n.machineNo,
                        },
                        create: {
                            id: n.id,
                            machineId: n.machineId,
                            machineNo: n.machineNo,
                        }
                    })
                }
            }
        }

        // 3. Records
        console.log('\nRestoring Records...')
        let recordCount = 0
        for (const r of backup.records || []) {
            await prisma.record.upsert({
                where: { id: r.id },
                update: {
                    date: r.date,
                    machineId: r.machineId,
                    machineNo: r.machineNo,
                    diff: r.diff,
                    big: r.big,
                    reg: r.reg,
                    games: r.games,
                    createdAt: r.createdAt,
                    updatedAt: r.updatedAt,
                },
                create: {
                    id: r.id,
                    date: r.date,
                    machineId: r.machineId,
                    machineNo: r.machineNo,
                    diff: r.diff,
                    big: r.big,
                    reg: r.reg,
                    games: r.games,
                    createdAt: r.createdAt,
                    updatedAt: r.updatedAt,
                }
            })
            recordCount++
            if (recordCount % 100 === 0) process.stdout.write('.')
        }
        console.log(`\nRestored ${recordCount} records.`)

        // 4. EventDays
        console.log('\nRestoring EventDays...')
        for (const e of backup.eventDays || []) {
            await prisma.eventDay.upsert({
                where: { id: e.id },
                update: {
                    date: e.date,
                    storeId: e.storeId,
                    label: e.label,
                    note: e.note,
                    createdAt: e.createdAt,
                    updatedAt: e.updatedAt,
                },
                create: {
                    id: e.id,
                    date: e.date,
                    storeId: e.storeId,
                    label: e.label,
                    note: e.note,
                    createdAt: e.createdAt,
                    updatedAt: e.updatedAt,
                }
            })
        }

        console.log('\n=== Restore Completed ===')

    } catch (error) {
        console.error('Restore failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

restore()
