import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Hash password for admin user - MUST MATCH lib/auth.ts
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Seeding database...');

  // Seed default SUPER_ADMIN user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@lunabar.bg';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminPasswordHash = hashPassword(adminPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
    },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Super Admin user created:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log('   ⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!');

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


