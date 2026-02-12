import { getMachines } from '@/lib/actions'
import MachinesClient from './MachinesClient'

export const dynamic = 'force-dynamic'

export default async function MachinesPage() {
    const machines = await getMachines()

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">機種・台番管理</h1>
            <MachinesClient machines={machines} />
        </div>
    )
}
