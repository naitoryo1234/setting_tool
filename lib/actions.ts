'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// 店舗一覧取得
export async function getStores() {
    return await prisma.store.findMany({
        orderBy: { name: 'asc' },
    })
}

import { Prisma } from '@prisma/client'

// 型定義
export type MachineWithNumbers = Prisma.MachineGetPayload<{
    include: { numbers: true }
}>

// 機種一覧取得（店舗IDでフィルタ可能）
export async function getMachines(storeId?: string): Promise<MachineWithNumbers[]> {
    return await prisma.machine.findMany({
        where: storeId ? { storeId } : undefined,
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
    big?: number
    reg?: number
    games?: number
}) {
    try {
        await prisma.record.update({
            where: { id },
            data: {
                date: data.date,
                machineId: data.machineId,
                machineNo: data.machineNo,
                diff: data.diff,
                big: data.big,
                reg: data.reg,
                games: data.games,
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
        // 同じ日付の場合は、その日の終わりまでを検索範囲とする
        if (params.startDate.getTime() === params.endDate.getTime()) {
            const endOfDay = new Date(params.endDate)
            endOfDay.setUTCHours(23, 59, 59, 999)
            where.date = { gte: params.startDate, lte: endOfDay }
        } else {
            where.date = { gte: params.startDate, lte: params.endDate }
        }
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
    totalBig: number
    totalReg: number
    totalGames: number
    count: number
}

export type MachineNoSummary = {
    machineId: string
    machineName: string
    machineNo: number
    totalDiff: number
    totalBig: number
    totalReg: number
    totalGames: number
    avgDiff: number
    count: number
}

export async function getSummary(start: Date, end: Date) {
    // 機種別合計
    const machineAgg = await prisma.record.groupBy({
        by: ['machineId'],
        where: {
            date: { gte: start, lte: end },
        },
        _sum: { diff: true, big: true, reg: true, games: true },
        _count: { diff: true },
    })

    // 台番号別合計
    const machineNoAgg = await prisma.record.groupBy({
        by: ['machineId', 'machineNo'],
        where: {
            date: { gte: start, lte: end },
        },
        _sum: { diff: true, big: true, reg: true, games: true },
        _count: { diff: true },
    })

    const machines = await prisma.machine.findMany()
    const machineMap = new Map(machines.map(m => [m.id, m.name]))

    const machineSummary: MachineSummary[] = machineAgg.map(agg => ({
        machineId: agg.machineId,
        machineName: machineMap.get(agg.machineId) || 'Unknown',
        totalDiff: agg._sum.diff || 0,
        totalBig: agg._sum.big || 0,
        totalReg: agg._sum.reg || 0,
        totalGames: agg._sum.games || 0,
        count: agg._count.diff || 0,
    })).sort((a, b) => a.totalDiff - b.totalDiff) // マイナス順（昇順）

    const machineNoSummary: MachineNoSummary[] = machineNoAgg.map(agg => {
        const totalDiff = agg._sum.diff || 0
        const count = agg._count.diff || 0
        return {
            machineId: agg.machineId,
            machineName: machineMap.get(agg.machineId) || 'Unknown',
            machineNo: agg.machineNo,
            totalDiff,
            totalBig: agg._sum.big || 0,
            totalReg: agg._sum.reg || 0,
            totalGames: agg._sum.games || 0,
            avgDiff: count > 0 ? Math.round(totalDiff / count) : 0,
            count,
        }
    }).sort((a, b) => a.totalDiff - b.totalDiff) // マイナス順（昇順）

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
    payoutRate: number // 推定出玉率 (%)
}

export type DowSummary = {
    dow: number        // 0=日, 1=月, ..., 6=土
    dowLabel: string   // 日/月/火/水/木/金/土
    totalGames: number
    totalBig: number
    totalReg: number
    totalHits: number
    hitProb: number
    totalDiff: number
    days: number
    payoutRate: number
}

export type AnalysisResult = {
    machineName: string
    machineId: string
    records: AnalysisRecord[]
    dowSummary: DowSummary[]
    eventDayCount: number
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
        payoutRate: number
    }
}


export async function getAnalysis(
    machineId: string,
    startDate?: Date,
    endDate?: Date,
    dayFilter?: 'all' | 'event' | 'normal', // イベント日フィルタ
): Promise<AnalysisResult | null> {
    const machine = await prisma.machine.findUnique({
        where: { id: machineId },
    })
    if (!machine) return null

    // BIG/Gamesデータが存在するレコードのみ対象
    const where: any = {
        machineId,
        big: { not: null },
        games: { not: null, gt: 0 },
    }

    if (startDate && endDate) {
        where.date = { gte: startDate, lte: endDate }
    }

    const records = await prisma.record.findMany({
        where,
        orderBy: [{ machineNo: 'asc' }, { date: 'asc' }],
    })

    // イベント日フィルタ用: 対象期間のイベント日を取得
    const eventDays = await prisma.eventDay.findMany({
        where: startDate && endDate ? { date: { gte: startDate, lte: endDate } } : undefined,
    })
    const eventDateSet = new Set(eventDays.map(e => e.date.toISOString().split('T')[0]))

    // フィルタ適用
    const filteredRecords = dayFilter && dayFilter !== 'all'
        ? records.filter(r => {
            const dateStr = r.date.toISOString().split('T')[0]
            const isEvent = eventDateSet.has(dateStr)
            return dayFilter === 'event' ? isEvent : !isEvent
        })
        : records

    // 台番号ごとに集計
    const byNo = new Map<number, { games: number; big: number; reg: number; diff: number; days: number }>()

    for (const r of filteredRecords) {
        const current = byNo.get(r.machineNo) || { games: 0, big: 0, reg: 0, diff: 0, days: 0 }
        current.games += r.games || 0
        current.big += r.big || 0
        current.reg += r.reg || 0
        current.diff += r.diff
        current.days += 1
        byNo.set(r.machineNo, current)
    }

    // 曜日別集計
    const byDow = new Map<number, { games: number; big: number; reg: number; diff: number; days: number }>()
    const dowDates = new Map<number, Set<string>>()
    for (const r of filteredRecords) {
        const dow = r.date.getUTCDay() // 0=日, 1=月, ...
        const current = byDow.get(dow) || { games: 0, big: 0, reg: 0, diff: 0, days: 0 }
        current.games += r.games || 0
        current.big += r.big || 0
        current.reg += r.reg || 0
        current.diff += r.diff
        byDow.set(dow, current)
        // ユニーク日数
        const dateStr = r.date.toISOString().split('T')[0]
        if (!dowDates.has(dow)) dowDates.set(dow, new Set())
        dowDates.get(dow)!.add(dateStr)
    }

    const calcProb = (games: number, count: number) => count > 0 ? Math.round(games / count) : 0
    const calcPayout = (games: number, diff: number) => {
        const invested = games * 3
        return invested > 0 ? Math.round(((invested + diff) / invested) * 1000) / 10 : 0
    }

    const analysisRecords: AnalysisRecord[] = []
    let overallGames = 0, overallBig = 0, overallReg = 0, overallDiff = 0

    for (const [machineNo, data] of byNo) {
        const totalHits = data.big + data.reg
        analysisRecords.push({
            machineNo,
            totalGames: data.games,
            totalBig: data.big,
            totalReg: data.reg,
            totalHits,
            bigProb: calcProb(data.games, data.big),
            regProb: calcProb(data.games, data.reg),
            hitProb: calcProb(data.games, totalHits),
            totalDiff: data.diff,
            days: data.days,
            payoutRate: calcPayout(data.games, data.diff),
        })
        overallGames += data.games
        overallBig += data.big
        overallReg += data.reg
        overallDiff += data.diff
    }

    const overallHits = overallBig + overallReg
    const uniqueDates = new Set(filteredRecords.map(r => r.date.toISOString().split('T')[0]))

    // 曜日別サマリー
    const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']
    const dowSummary: DowSummary[] = []
    for (const [dow, data] of byDow) {
        const totalHits = data.big + data.reg
        const days = dowDates.get(dow)?.size || 0
        dowSummary.push({
            dow,
            dowLabel: DOW_LABELS[dow],
            totalGames: data.games,
            totalBig: data.big,
            totalReg: data.reg,
            totalHits,
            hitProb: calcProb(data.games, totalHits),
            totalDiff: data.diff,
            days,
            payoutRate: calcPayout(data.games, data.diff),
        })
    }
    dowSummary.sort((a, b) => a.dow - b.dow)

    return {
        machineName: machine.name,
        machineId: machine.id,
        records: analysisRecords,
        dowSummary,
        eventDayCount: eventDateSet.size,
        overall: {
            totalGames: overallGames,
            totalBig: overallBig,
            totalReg: overallReg,
            totalHits: overallHits,
            bigProb: calcProb(overallGames, overallBig),
            regProb: calcProb(overallGames, overallReg),
            hitProb: calcProb(overallGames, overallHits),
            totalDiff: overallDiff,
            days: uniqueDates.size,
            payoutRate: calcPayout(overallGames, overallDiff),
        },
    }
}

// === EventDay 管理 ===

export async function getEventDays(storeId?: string) {
    return await prisma.eventDay.findMany({
        where: storeId ? { storeId } : undefined,
        orderBy: { date: 'desc' },
    })
}

export async function toggleEventDay(date: Date, storeId: string) {
    const existing = await prisma.eventDay.findUnique({
        where: { date_storeId: { date, storeId } },
    })
    if (existing) {
        await prisma.eventDay.delete({ where: { id: existing.id } })
        return { added: false }
    } else {
        await prisma.eventDay.create({
            data: { date, storeId },
        })
        return { added: true }
    }
}

