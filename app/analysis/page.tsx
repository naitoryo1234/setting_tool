import { getMachines, getStores } from '@/lib/actions'
import AnalysisClient from './AnalysisClient'

export const dynamic = 'force-dynamic'

export default async function AnalysisPage() {
    const [machines, stores] = await Promise.all([
        getMachines(),
        getStores(),
    ])

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">初当たり分析</h1>
            <AnalysisClient machines={machines} stores={stores} />
        </div>
    )
}
