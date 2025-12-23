const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  console.log('📦 Applying QR scan history migration...');
  
  try {
    // Create table first
    console.log('   Creating qr_scans table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS qr_scans (
        id TEXT PRIMARY KEY,
        table_id TEXT NOT NULL REFERENCES bar_tables(id) ON DELETE CASCADE,
        table_number INTEGER NOT NULL,
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('   ✅ Table created');
    
    // Create indexes
    console.log('   Creating indexes...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_qr_scans_table_id ON qr_scans(table_id)
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_qr_scans_scanned_at ON qr_scans(scanned_at)
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_qr_scans_table_number ON qr_scans(table_number)
    `);
    console.log('   ✅ Indexes created');
    
    console.log('✅ Migration applied successfully!');
    console.log('✅ QR scan history table created with indexes');
    
    // Verify table exists
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'qr_scans'
    `;
    
    if (tables.length > 0) {
      console.log('✅ Verified: qr_scans table exists');
    } else {
      console.log('⚠️  Warning: Could not verify table creation');
    }
    
    console.log('');
    console.log('✨ Next steps:');
    console.log('   1. Run: npx prisma generate');
    console.log('   2. Restart your dev server');
    console.log('');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

