'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getMachines() {
    return await prisma.machine.findMany({
        orderBy: { name: 'asc' },
        include: {
            numbers: {
                orderBy: { machineNo: 'asc' },
            },
        },
    })
}

export async function addMachineNumber(machineId: string, machineNo: number) {
    try {
        await prisma.machineNumber.create({
            data: {
                machineId,
                machineNo,
            },
        })
        revalidatePath('/machines')
        revalidatePath('/input')
        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, error: '既に登録されています' }
        }
        return { success: false, error: '登録に失敗しました' }
    }
}

export async function deleteMachineNumber(id: string) {
    try {
        await prisma.machineNumber.delete({
            where: { id },
        })
        revalidatePath('/machines')
        revalidatePath('/input')
        return { success: true }
    } catch (error) {
        return { success: false, error: '削除に失敗しました' }
    }
}

export async function upsertRecord(data: {
    date: Date
    machineId: string
    machineNo: number
    diff: number
}) {
    const { date, machineId, machineNo, diff } = data
    try {
        await prisma.record.upsert({
            where: {
                date_machineId_machineNo: {
                    date,
                    machineId,
                    machineNo,
                },
            },
            update: { diff },
            create: {
                date,
                machineId,
                machineNo,
                diff,
            },
        })
        revalidatePath('/input')
        revalidatePath('/summary')
        revalidatePath('/records')
        return { success: true }
    } catch (error) {
        console.error('Failed to upsert record:', error)
        return { success: false, error: 'Failed to save record' }
    }
}

export async function deleteRecord(id: string) {
    try {
        await prisma.record.delete({
            where: { id },
        })
        revalidatePath('/input')
        revalidatePath('/summary')
        revalidatePath('/records')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete record:', error)
        return { success: false, error: 'Failed to delete record' }
    }
}

export async function updateRecord(id: string, data: {
    date: Date
    machineId: string
    machineNo: number
    diff: number
}) {
    try {
        await prisma.record.update({
            where: { id },
            data: {
                date: data.date,
                machineId: data.machineId,
                machineNo: data.machineNo,
                diff: data.diff,
            },
        })
        revalidatePath('/input')
        revalidatePath('/summary')
        revalidatePath('/records')
        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, error: '同じ日付・機種・台番のデータが既に存在します。' }
        }
        console.error('Failed to update record:', error)
        return { success: false, error: '保存に失敗しました' }
    }
}

export async function getRecords(date: Date) {
    return await prisma.record.findMany({
        where: { date },
        include: { machine: true },
        orderBy: { updatedAt: 'desc' },
    })
}


export async function searchRecords(params: {
    startDate?: Date
    endDate?: Date
    machineId?: string
    machineNo?: number
}) {
    const where: any = {}

    if (params.startDate && params.endDate) {
        where.date = { gte: params.startDate, lte: params.endDate }
    }
    if (params.machineId) where.machineId = params.machineId
    if (params.machineNo) where.machineNo = params.machineNo

    return await prisma.record.findMany({
        where,
        include: { machine: true },
        orderBy: { date: 'desc' },
        take: 1000 // Limit for safety
    })
}

export async function getRecordsRange(start: Date, end: Date) {
    return await prisma.record.findMany({
        where: {
            date: {
                gte: start,
                lte: end,
            },
        },
        include: { machine: true },
        orderBy: { date: 'desc' },
    })
}

export type MachineSummary = {
    machineId: string
    machineName: string
    totalDiff: number
    count: number
}

export type MachineNoSummary = {
    machineId: string
    machineName: string
    machineNo: number
    totalDiff: number
    count: number
}

export async function getSummary(start: Date, end: Date) {
    // Machine Totals
    const machineAgg = await prisma.record.groupBy({
        by: ['machineId'],
        where: {
            date: { gte: start, lte: end },
        },
        _sum: { diff: true },
        _count: { diff: true },
    })

    // MachineNo Totals
    const machineNoAgg = await prisma.record.groupBy({
        by: ['machineId', 'machineNo'],
        where: {
            date: { gte: start, lte: end },
        },
        _sum: { diff: true },
        _count: { diff: true },
    })

    // Need to fetch machine names manually or client-side join. 
    // Prisma groupBy doesn't support include.
    const machines = await prisma.machine.findMany()
    const machineMap = new Map(machines.map(m => [m.id, m.name]))

    const machineSummary: MachineSummary[] = machineAgg.map(agg => ({
        machineId: agg.machineId,
        machineName: machineMap.get(agg.machineId) || 'Unknown',
        totalDiff: agg._sum.diff || 0,
        count: agg._count.diff || 0,
    })).sort((a, b) => b.totalDiff - a.totalDiff) // Default sort by diff desc

    const machineNoSummary: MachineNoSummary[] = machineNoAgg.map(agg => ({
        machineId: agg.machineId,
        machineName: machineMap.get(agg.machineId) || 'Unknown',
        machineNo: agg.machineNo,
        totalDiff: agg._sum.diff || 0,
        count: agg._count.diff || 0,
    })).sort((a, b) => b.totalDiff - a.totalDiff)

    return { machineSummary, machineNoSummary }
}

// 台番号別の日付ごと履歴を取得
export async function getMachineNoHistory(machineId: string, machineNo: number) {
    const machine = await prisma.machine.findUnique({
        where: { id: machineId },
    })

    const records = await prisma.record.findMany({
        where: {
            machineId,
            machineNo,
        },
        orderBy: { date: 'desc' },
    })

    return {
        machineName: machine?.name || 'Unknown',
        machineNo,
        records: records.map(r => ({
            id: r.id,
            date: r.date,
            diff: r.diff,
            big: r.big,
            games: r.games,
            reg: r.reg,
        })),
    }
}

// 初当たり確率分析用データ取得
export type AnalysisRecord = {
    machineNo: number
    totalGames: number
    totalBig: number
    totalReg: number
    totalHits: number // BIG + REG
    bigProb: number   // 1/X形式のX
    regProb: number
    hitProb: number   // 合算確率
    totalDiff: number
    days: number      // データ日数
}

export type AnalysisResult = {
    machineName: string
    machineId: string
    records: AnalysisRecord[]
    overall: {
        totalGames: number
        totalBig: number
        totalReg: number
        totalHits: number
        bigProb: number
        regProb: number
        hitProb: number
        totalDiff: number
        days: number
    }
}

export async function getAnalysis(
    machineId: string,
    startDate?: Date,
    endDate?: Date,
): Promise<AnalysisResult | null> {
    const machine = await prisma.machine.findUnique({
        where: { id: machineId },
    })
    if (!machine) return null

    // BIG/Games/REGデータが存在するレコードのみ対象
    const where: any = {
        machineId,
        big: { not: null, gt: 0 },
        games: { not: null, gt: 0 },
    }
    // big=0 でも games>0 なら含めたいので、bigの条件を緩める
    // ただし big=0, games=0 は除外（データなし）
    where.big = { not: null }
    where.games = { not: null, gt: 0 }

    if (startDate && endDate) {
        where.date = { gte: startDate, lte: endDate }
    }

    const records = await prisma.record.findMany({
        where,
        orderBy: [{ machineNo: 'asc' }, { date: 'asc' }],
    })

    // 台番号ごとに集計
    const byNo = new Map<number, { games: number; big: number; reg: number; diff: number; days: number }>()

    for (const r of records) {
        const current = byNo.get(r.machineNo) || { games: 0, big: 0, reg: 0, diff: 0, days: 0 }
        current.games += r.games || 0
        current.big += r.big || 0
        current.reg += r.reg || 0
        current.diff += r.diff
        current.days += 1
        byNo.set(r.machineNo, current)
    }

    const analysisRecords: AnalysisRecord[] = []
    let overallGames = 0, overallBig = 0, overallReg = 0, overallDiff = 0, overallDays = 0

    for (const [machineNo, data] of byNo) {
        const totalHits = data.big + data.reg
        analysisRecords.push({
            machineNo,
            totalGames: data.games,
            totalBig: data.big,
            totalReg: data.reg,
            totalHits,
            bigProb: data.big > 0 ? Math.round(data.games / data.big) : 0,
            regProb: data.reg > 0 ? Math.round(data.games / data.reg) : 0,
            hitProb: totalHits > 0 ? Math.round(data.games / totalHits) : 0,
            totalDiff: data.diff,
            days: data.days,
        })
        overallGames += data.games
        overallBig += data.big
        overallReg += data.reg
        overallDiff += data.diff
        overallDays = Math.max(overallDays, data.days) // 最大日数
    }

    const overallHits = overallBig + overallReg
    // overallDays は全台の合計ではなくユニークな日数を出したい
    const uniqueDates = new Set(records.map(r => r.date.toISOString().split('T')[0]))

    return {
        machineName: machine.name,
        machineId: machine.id,
        records: analysisRecords,
        overall: {
            totalGames: overallGames,
            totalBig: overallBig,
            totalReg: overallReg,
            totalHits: overallHits,
            bigProb: overallBig > 0 ? Math.round(overallGames / overallBig) : 0,
            regProb: overallReg > 0 ? Math.round(overallGames / overallReg) : 0,
            hitProb: overallHits > 0 ? Math.round(overallGames / overallHits) : 0,
            totalDiff: overallDiff,
            days: uniqueDates.size,
        },
    }
}

