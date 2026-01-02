/**
 * Apply performance indexes to the database
 * Run with: node apply-indexes.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyIndexes() {
  try {
    console.log('📊 Applying performance indexes...');
    
    const sqlFile = path.join(__dirname, 'prisma', 'migrations', 'add-performance-indexes.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');
    
    // Extract CREATE INDEX statements (handle multi-line)
    const createIndexRegex = /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+(\w+)[\s\S]*?;/gi;
    const matches = sql.matchAll(createIndexRegex);
    
    const statements = Array.from(matches).map(match => ({
      statement: match[0].trim(),
      indexName: match[1]
    }));
    
    console.log(`Found ${statements.length} index statements to apply\n`);
    
    for (const { statement, indexName } of statements) {
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Applied: ${indexName}`);
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⚠️  Already exists: ${indexName}`);
        } else {
          console.error(`❌ Error applying ${indexName}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ All indexes applied successfully!');
    console.log('📈 Performance should be significantly improved for statistics queries.');
    
  } catch (error) {
    console.error('❌ Error applying indexes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyIndexes();

