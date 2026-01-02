const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📦 Applying QR tracking migration...');
  
  try {
    await prisma.$executeRaw`
      ALTER TABLE bar_tables 
      ADD COLUMN IF NOT EXISTS redirect_url TEXT,
      ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMP;
    `;
    
    console.log('✅ Migration applied successfully!');
    
    // Set default redirect URLs for existing tables
    const tables = await prisma.barTable.findMany();
    console.log(`📋 Found ${tables.length} tables`);
    
    for (const table of tables) {
      if (!table.redirectUrl) {
        await prisma.$executeRaw`
          UPDATE bar_tables 
          SET redirect_url = ${`/bg/order?table=${table.tableNumber}`}
          WHERE id = ${table.id};
        `;
        console.log(`✅ Set default redirect for table ${table.tableNumber}`);
      }
    }
    
    console.log('✅ All done!');
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

