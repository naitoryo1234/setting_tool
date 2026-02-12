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
  // デフォルト店舗を作成
  const defaultStore = await prisma.store.upsert({
    where: { name: '導入店' },
    update: {},
    create: { name: '導入店' },
  })

  console.log(`Created default store: ${defaultStore.name}`)

  for (const name of initialMachines) {
    const machine = await prisma.machine.upsert({
      where: {
        storeId_name: {
          storeId: defaultStore.id,
          name
        }
      },
      update: {},
      create: {
        name,
        storeId: defaultStore.id
      },
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
