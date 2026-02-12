import { getMachines } from '@/lib/actions'
import SummaryClient from './SummaryClient'

export const dynamic = 'force-dynamic'

export default async function SummaryPage() {
    const machines = (await getMachines()) as { id: string; name: string }[]

    return (
        <SummaryClient machines={machines} />
    )
}
