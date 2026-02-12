import { getMachines } from '@/lib/actions'
import SummaryClient from './SummaryClient'

export const dynamic = 'force-dynamic'

export default async function SummaryPage() {
    const machines = await getMachines()

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">集計</h1>
            <SummaryClient machines={machines} />
        </div>
    )
}
