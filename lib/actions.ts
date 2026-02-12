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
