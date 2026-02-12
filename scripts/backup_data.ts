import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

async function backup() {
    try {
        const machines = await prisma.machine.findMany({
            include: { numbers: true }
        })
        const records = await prisma.record.findMany()

        const backupData = {
            timestamp: new Date().toISOString(),
            machines,
            records
        }

        const backupPath = path.join(process.cwd(), 'backup_data.json')
        await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2))

        console.log(`Backup completed successfully: ${backupPath}`)
        console.log(`- Machines: ${machines.length}`)
        console.log(`- MachineNumbers: ${machines.reduce((acc, m) => acc + m.numbers.length, 0)}`)
        console.log(`- Records: ${records.length}`)

    } catch (error) {
        console.error('Backup failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

backup()
