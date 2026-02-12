import { getMachines } from '@/lib/actions'
import AnalysisClient from './AnalysisClient'

export const dynamic = 'force-dynamic'

export default async function AnalysisPage() {
    const machines = await getMachines()

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">初当たり分析</h1>
            <AnalysisClient machines={machines} />
        </div>
    )
}
