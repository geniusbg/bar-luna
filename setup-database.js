// Luna Bar - Complete Database Setup Script
require('dotenv').config({ path: '.env' });
const { Client } = require('pg');
const fs = require('fs');

async function main() {
  console.log('');
  console.log('🌙 Luna Bar - Database Setup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  console.log('🔌 Connecting to PostgreSQL...');
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database!');
    console.log('');

    // Read and execute migration
    console.log('📦 Reading migration SQL...');
    const sql = fs.readFileSync('SIMPLE_MIGRATION.sql', 'utf8');
    
    console.log('🚀 Creating tables...');
    await client.query(sql);
    console.log('✅ Tables created!');
    console.log('');

    // Verify setup
    console.log('📊 Verifying setup...');
    
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`✓ Created ${tables.rows.length} tables:`);
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    console.log('');

    const catCount = await client.query('SELECT COUNT(*) FROM categories');
    const tableCount = await client.query('SELECT COUNT(*) FROM bar_tables');
    
    console.log('✓ Initial Data:');
    console.log(`   - ${catCount.rows[0].count} categories`);
    console.log(`   - ${tableCount.rows[0].count} tables`);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Database setup complete!');
    console.log('');
    console.log('✨ Next steps:');
    console.log('   1. npm run dev');
    console.log('   2. Visit http://localhost:3000/bg');
    console.log('   3. Add products: http://localhost:3000/bg/admin/products');
    console.log('   4. Generate QR codes: http://localhost:3000/bg/admin/qr');
    console.log('   5. Test ordering: http://localhost:3000/order?table=5');
    console.log('   6. Staff dashboard: http://localhost:3000/bg/staff');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   - Check DATABASE_URL in .env file');
    console.error('   - Make sure PostgreSQL is running');
    console.error('   - Verify database "luna_bar" exists');
    console.error('   - Check username/password are correct');
    console.error('');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

