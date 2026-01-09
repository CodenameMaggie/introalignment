#!/usr/bin/env node

/**
 * Migration Verification Script
 * Checks for duplicate numbers, missing sequences, and naming issues
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');

console.log('🔍 Verifying database migrations...\n');

// Get all migration files
const files = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  console.log('❌ No migration files found!');
  process.exit(1);
}

console.log(`📁 Found ${files.length} migration files\n`);

// Extract numbers and check for issues
const issues = [];
const numbers = [];
const fileMap = {};

files.forEach(file => {
  const match = file.match(/^(\d+)_(.+)\.sql$/);

  if (!match) {
    issues.push(`❌ Invalid filename format: ${file}`);
    return;
  }

  const [_, number, name] = match;
  const numInt = parseInt(number);

  numbers.push(numInt);

  if (fileMap[number]) {
    issues.push(`❌ DUPLICATE NUMBER: ${number} used by both:\n   - ${fileMap[number]}\n   - ${file}`);
  } else {
    fileMap[number] = file;
  }

  // Check naming conventions
  if (name.includes(' ')) {
    issues.push(`⚠️  Spaces in filename (use underscores): ${file}`);
  }

  if (name.toUpperCase() === name) {
    issues.push(`⚠️  All caps filename: ${file}`);
  }
});

// Check for sequential issues
numbers.sort((a, b) => a - b);
const missingNumbers = [];

for (let i = 1; i < numbers[numbers.length - 1]; i++) {
  if (!numbers.includes(i)) {
    missingNumbers.push(i);
  }
}

if (missingNumbers.length > 0) {
  issues.push(`⚠️  Missing migration numbers: ${missingNumbers.join(', ')}`);
}

// Print results
console.log('📋 Migration List:\n');
files.forEach((file, index) => {
  const number = file.match(/^(\d+)/)[0];
  const status = issues.some(i => i.includes(file)) ? '❌' : '✅';
  console.log(`   ${status} ${index + 1}. ${file}`);
});

console.log('\n' + '='.repeat(60));

if (issues.length === 0) {
  console.log('\n✅ All migrations verified successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Total migrations: ${files.length}`);
  console.log(`   - Number range: ${numbers[0]} - ${numbers[numbers.length - 1]}`);
  console.log(`   - No duplicates found`);
  console.log(`   - Sequential order: ${missingNumbers.length === 0 ? 'Perfect' : 'Some gaps'}`);

  if (missingNumbers.length > 0) {
    console.log(`\n⚠️  Note: Missing numbers ${missingNumbers.join(', ')} (not critical if intentional)`);
  }

  console.log('\n');
  process.exit(0);
} else {
  console.log('\n❌ Migration verification failed!\n');
  console.log('Issues found:\n');
  issues.forEach(issue => {
    console.log(`   ${issue}`);
  });
  console.log('\n💡 Fix these issues before deploying!\n');
  process.exit(1);
}
