
import { PrismaClient } from '@prisma/client'
import minimist from 'minimist'

const prisma = new PrismaClient()

const COINS_PER_BIG = 134
const COINS_PER_GAME = 1.52

interface DataItem {
    no: number
    big: number
    games: number
    diff?: number
}

async function registerData() {
    const args = minimist(process.argv.slice(2))

    const dateStr = args['date'] // YYYY-MM-DD
    const machineName = args['machine'] // e.g., "北斗"
    const rawData = args['data'] // e.g., "238 26 2770, 245 62 2459 7500"
    const storeName = args['store'] || '保土ヶ谷ガイア' // デフォルト: 保土ヶ谷ガイア

    if (!dateStr || !machineName || !rawData) {
        console.error('Usage: npm run register-data -- --date=YYYY-MM-DD --machine="MachineName" --data="No BIG Games [Diff], ..." [--store="StoreName"]')
        process.exit(1)
    }

    console.log(`Processing data for: ${machineName} at ${storeName} on ${dateStr}`)

    // 0. Find or Create Store
    let store = await prisma.store.findFirst({
        where: { name: { contains: storeName } }
    })
    if (!store) {
        store = await prisma.store.create({
            data: { name: storeName }
        })
        console.log(`Created new store: ${storeName}`)
    }

    // 1. Find Machine (within store)
    let machine = await prisma.machine.findFirst({
        where: {
            name: { contains: machineName },
            storeId: store.id,
        },
        include: {
            numbers: true
        }
    })

    if (!machine) {
        // 機種がこの店舗に登録されていない場合、自動作成
        machine = await prisma.machine.create({
            data: { name: machineName, storeId: store.id },
            include: { numbers: true }
        })
        console.log(`Created new machine: ${machineName} at ${storeName}`)
    }

    // 2. Parse Data
    const items: DataItem[] = []
    // Split by comma for multiple items (handle potential spaces around commas)
    // If rawData is "238 26 2770", split(',') gives ["238 26 2770"]
    const rawItems = rawData.split(',')

    for (const rawItem of rawItems) {
        const parts = rawItem.trim().split(/\s+/)
        if (parts.length >= 3) {
            items.push({
                no: parseInt(parts[0]),
                big: parseInt(parts[1]),
                games: parseInt(parts[2]),
                diff: parts[3] ? parseInt(parts[3]) : undefined
            })
        }
    }

    console.log(`Parsed ${items.length} items.`)
    if (items.length === 0) {
        console.warn('No valid data items found in input string:', rawData)
        process.exit(0)
    }

    // 3. Upsert Records
    const targetDate = new Date(dateStr)
    let successCount = 0

    for (const item of items) {
        // Calculate Diff
        let finalDiff = 0
        if (item.diff !== undefined && !isNaN(item.diff)) {
            finalDiff = item.diff
            console.log(`No. ${item.no}: Override diff ${finalDiff}`)
        } else {
            finalDiff = Math.round((item.big * COINS_PER_BIG) - (item.games * COINS_PER_GAME))
            console.log(`No. ${item.no}: Estimated diff ${finalDiff} (BIG:${item.big} G:${item.games})`)
        }

        // Ensure machine number
        const mnSub = machine.numbers as any[] // Bypass potential type mismatch in local dev env
        let machineNumber = mnSub.find(mn => mn.machineNo === item.no)

        if (!machineNumber) {
            console.log(`Adding new machine number: ${item.no}`)
            try {
                await prisma.machineNumber.create({
                    data: {
                        machineId: machine.id,
                        machineNo: item.no
                    }
                })
            } catch (e) {
                console.error(`Failed to add machine number ${item.no}`, e)
                continue
            }
        }

        // Upsert Record
        try {
            // Constraint name verification:
            // @@unique([date, machineId, machineNo]) -> default name is date_machineId_machineNo
            await prisma.record.upsert({
                where: {
                    // Use the default compound unique constraint name
                    date_machineId_machineNo: {
                        machineId: machine.id,
                        machineNo: item.no,
                        date: targetDate
                    }
                },
                update: {
                    diff: finalDiff,
                    big: item.big,
                    games: item.games
                },
                create: {
                    machineId: machine.id,
                    machineNo: item.no,
                    date: targetDate,
                    diff: finalDiff,
                    big: item.big,
                    games: item.games
                }
            })
            successCount++
        } catch (e: any) {
            // Fallback: try different constraint name order if default fails?
            // Or just log error
            console.error(`Failed to save record for No. ${item.no}:`, e.message || e)
        }
    }

    console.log(`Successfully registered ${successCount} records.`)
}

registerData()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
