import { getMachines } from '@/lib/actions'
import RecordsClient from './RecordsClient'

export const dynamic = 'force-dynamic'

export default async function RecordsPage() {
    const machines = await getMachines()

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">記録一覧・編集</h1>
            <RecordsClient machines={machines} />
        </div>
    )
}
