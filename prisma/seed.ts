import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const initialMachines = [
  'マギレコ',
  '北斗転生',
  '化物語',
  '炎炎2',
]

async function main() {
  console.log('Start seeding...')
  for (const name of initialMachines) {
    const machine = await prisma.machine.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    console.log(`Created machine with id: ${machine.id}`)
  }
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
