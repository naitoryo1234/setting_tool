
import { TargetsClient } from './TargetsClient'
import { getMachines, getTargetMachines } from '@/lib/actions'

export default async function TargetsPage() {
    const machines = await getMachines()

    return (
        <div className="container mx-auto py-6">
            <TargetsClient machines={machines} />
        </div>
    )
}
