import { getMachines, getRecords, MachineWithNumbers } from '@/lib/actions'
import InputClient from './InputClient'

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'

export default async function InputPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>
}) {
    const params = await searchParams
    // Default to today in JST
    const now = new Date()
    const offset = 9 * 60 * 60 * 1000 // JST +9
    const jstDate = new Date(now.getTime() + offset)
    const todayStr = jstDate.toISOString().split('T')[0]

    const dateStr = params.date || todayStr

    // Create Date object for query
    const queryDate = new Date(dateStr)

    const machines = await getMachines()
    const todayRecords = await getRecords(queryDate)

    return (
        <div>
            <h1 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                <span className="text-2xl">📥</span> 稼働入力
            </h1>
            <InputClient
                machines={machines}
                todayRecords={todayRecords}
                currentDate={dateStr}
            />
        </div>
    )
}
