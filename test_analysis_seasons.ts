import { getAnalysis } from './lib/actions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const machines = await prisma.machine.findMany();
    for (const machine of machines) {
        const analysis = await getAnalysis(machine.id);
        console.log(machine.name, analysis?.availableSeasons);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
