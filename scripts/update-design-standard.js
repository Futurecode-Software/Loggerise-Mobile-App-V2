#!/usr/bin/env node

/**
 * Bulk update script to apply design standard to all screen files
 *
 * This script updates all screen files to follow the new design standard:
 * 1. Container background: Brand.primary (solid green)
 * 2. Content area: White with rounded top corners and shadow
 */

const fs = require('fs');
const path = require('path');

// Files to update
const filesToUpdate = [
  'app/(tabs)/contacts.tsx',
  'app/bank/index.tsx',
  'app/bank/new.tsx',
  'app/bank/[id].tsx',
  'app/bank/[id]/edit.tsx',
  'app/cash-register/index.tsx',
  'app/cash-register/new.tsx',
  'app/cash-register/[id].tsx',
  'app/cash-register/[id]/edit.tsx',
  'app/crm.tsx',
  'app/crm/customers/index.tsx',
  'app/crm/customers/new.tsx',
  'app/crm/customers/[id].tsx',
  'app/crm/customers/[id]/edit.tsx',
  'app/crm/customers/[id]/interactions/new.tsx',
  'app/crm/customers/[id]/interactions/[interactionId].tsx',
  'app/domestic/index.tsx',
  'app/domestic/new.tsx',
  'app/domestic/[id].tsx',
  'app/employee/index.tsx',
  'app/employee/new.tsx',
  'app/employee/[id].tsx',
  'app/employee/[id]/edit.tsx',
  'app/exports/disposition/index.tsx',
  'app/exports/loads/index.tsx',
  'app/exports/operations/index.tsx',
  'app/exports/positions/index.tsx',
  'app/exports/positions/[id].tsx',
  'app/finance/checks/index.tsx',
  'app/finance/notes/index.tsx',
  'app/fleet/driver-tractor/index.tsx',
  'app/fleet/driver-tractor/new.tsx',
  'app/fleet/driver-tractor/[id].tsx',
  'app/fleet/fault-reports/index.tsx',
  'app/fleet/tire-warehouse/index.tsx',
  'app/fleet/tire-warehouse/new.tsx',
  'app/fleet/tire-warehouse/[id].tsx',
  'app/fleet/tractor-trailer/index.tsx',
  'app/fleet/tractor-trailer/new.tsx',
  'app/fleet/tractor-trailer/[id].tsx',
  'app/imports/disposition/index.tsx',
  'app/imports/loads/index.tsx',
  'app/imports/operations/index.tsx',
  'app/imports/positions/index.tsx',
  'app/imports/positions/[id].tsx',
  'app/loggy.tsx',
  'app/products.tsx',
  'app/quotes.tsx',
  'app/stock/brands/index.tsx',
  'app/stock/brands/new.tsx',
  'app/stock/brands/[id].tsx',
  'app/stock/categories/index.tsx',
  'app/stock/categories/new.tsx',
  'app/stock/categories/[id].tsx',
  'app/stock/models/index.tsx',
  'app/stock/models/new.tsx',
  'app/stock/models/[id].tsx',
  'app/stock/movements/index.tsx',
  'app/stock/movements/new.tsx',
  'app/stock/movements/[id].tsx',
  'app/stock/products/index.tsx',
  'app/stock/products/new.tsx',
  'app/stock/products/[id].tsx',
  'app/transactions.tsx',
  'app/trip/index.tsx',
  'app/trip/[id].tsx',
  'app/vehicle/index.tsx',
  'app/vehicle/new.tsx',
  'app/vehicle/[id].tsx',
  'app/vehicle/[id]/edit.tsx',
  'app/warehouse/index.tsx',
  'app/warehouse/new.tsx',
  'app/warehouse/[id].tsx',
  'app/warehouse/[id]/edit.tsx',
];

const rootDir = path.resolve(__dirname, '..');

let updatedCount = 0;
let skippedCount = 0;
let errorCount = 0;

console.log('🚀 Starting design standard update...\n');

filesToUpdate.forEach((relPath) => {
  const filePath = path.join(rootDir, relPath);

  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipped (not found): ${relPath}`);
    skippedCount++;
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if Brand is already imported
    if (!content.includes("import { Brand")) {
      // Add Brand import to existing theme import
      if (content.includes("from '@/constants/theme'")) {
        content = content.replace(
          /import {([^}]+)} from '@\/constants\/theme'/,
          (match, imports) => {
            if (!imports.includes('Brand')) {
              return `import {${imports}, Brand, BorderRadius, Shadows} from '@/constants/theme'`;
            }
            return match;
          }
        );
        modified = true;
      }
    }

    // Update container backgroundColor from colors.background to Brand.primary
    if (content.includes('backgroundColor: colors.background')) {
      content = content.replace(
        /backgroundColor: colors\.background/g,
        'backgroundColor: Brand.primary'
      );
      modified = true;
    }

    // Add rounded corners and shadow to content style if not present
    if (content.includes('style={styles.content}') && !content.includes('borderTopLeftRadius')) {
      // Look for content style definition
      const contentStyleRegex = /content:\s*{([^}]+)}/;
      if (contentStyleRegex.test(content)) {
        content = content.replace(
          contentStyleRegex,
          (match, styles) => {
            if (!styles.includes('borderTopLeftRadius')) {
              return `content: {${styles},
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  }`;
            }
            return match;
          }
        );
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${relPath}`);
      updatedCount++;
    } else {
      console.log(`⏭️  Skipped (already up-to-date): ${relPath}`);
      skippedCount++;
    }
  } catch (error) {
    console.error(`❌ Error updating ${relPath}:`, error.message);
    errorCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Updated: ${updatedCount}`);
console.log(`   ⏭️  Skipped: ${skippedCount}`);
console.log(`   ❌ Errors: ${errorCount}`);
console.log(`\n✨ Done!\n`);
