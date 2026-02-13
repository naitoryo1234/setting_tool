import { getMachines, searchRecords } from '@/lib/actions'
import RecordsClient from './RecordsClient'

export const dynamic = 'force-dynamic'

export default async function RecordsPage() {
    const machines = await getMachines()
    const initialRecords = await searchRecords({})

    return (
        <div>
            <RecordsClient machines={machines} initialRecords={initialRecords} />
        </div>
    )
}
