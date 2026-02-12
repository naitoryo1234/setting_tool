// 完全バックアップスクリプト（Store/EventDay含む）
import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

async function backup() {
    try {
        const stores = await prisma.store.findMany()
        const machines = await prisma.machine.findMany({
            include: { numbers: true }
        })
        const records = await prisma.record.findMany()
        const eventDays = await prisma.eventDay.findMany()

        const backupData = {
            timestamp: new Date().toISOString(),
            version: 2, // Store対応版
            stores,
            machines,
            records,
            eventDays,
        }

        const backupPath = path.join(process.cwd(), 'backup_data.json')
        await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2))

        console.log(`\n=== バックアップ完了 ===`)
        console.log(`ファイル: ${backupPath}`)
        console.log(`- Stores: ${stores.length}`)
        console.log(`- Machines: ${machines.length}`)
        console.log(`- MachineNumbers: ${machines.reduce((acc, m) => acc + m.numbers.length, 0)}`)
        console.log(`- Records: ${records.length}`)
        console.log(`- EventDays: ${eventDays.length}`)

    } catch (error) {
        console.error('バックアップ失敗:', error)
    } finally {
        await prisma.$disconnect()
    }
}

backup()
