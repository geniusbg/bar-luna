import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed categories
  const categories = [
    { nameBg: 'Алкохол', nameEn: 'Alcohol', nameDe: 'Alkohol', slug: 'alcohol', order: 1 },
    { nameBg: 'Кафе Costa', nameEn: 'Costa Coffee', nameDe: 'Costa Kaffee', slug: 'costa-coffee', order: 2 },
    { nameBg: 'Кафе Richard', nameEn: 'Richard Coffee', nameDe: 'Richard Kaffee', slug: 'richard-coffee', order: 3 },
    { nameBg: 'Топли Напитки', nameEn: 'Hot Drinks', nameDe: 'Heiße Getränke', slug: 'hot-drinks', order: 4 },
    { nameBg: 'Студени Напитки', nameEn: 'Cold Drinks', nameDe: 'Kalte Getränke', slug: 'cold-drinks', order: 5 },
    { nameBg: 'Фреш', nameEn: 'Fresh Juices', nameDe: 'Frische Säfte', slug: 'fresh-juices', order: 6 },
    { nameBg: 'Безалкохолни', nameEn: 'Soft Drinks', nameDe: 'Erfrischungsgetränke', slug: 'soft-drinks', order: 7 },
    { nameBg: 'Лимонади', nameEn: 'Lemonades', nameDe: 'Limonaden', slug: 'lemonades', order: 8 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log('✅ Categories seeded (8 categories)');

  // Seed 30 tables
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  for (let i = 1; i <= 30; i++) {
    const location = i <= 20 ? 'indoor' : i <= 25 ? 'terrace' : 'bar';
    await prisma.barTable.upsert({
      where: { tableNumber: i },
      update: {},
      create: {
        tableNumber: i,
        tableName: `Маса ${i}`,
        capacity: i <= 25 ? 4 : 2,
        location,
        qrCodeUrl: `${appUrl}/order?table=${i}`,
      },
    });
  }

  console.log('✅ Tables seeded (30 tables)');
  console.log('   - Indoor: Tables 1-20');
  console.log('   - Terrace: Tables 21-25');
  console.log('   - Bar: Tables 26-30');

  console.log('\n🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


