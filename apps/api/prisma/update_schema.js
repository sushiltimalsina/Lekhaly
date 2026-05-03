const fs = require('fs');
const path = 'c:/Lekhaly/apps/api/prisma/schema.prisma';
let content = fs.readFileSync(path, 'utf8');

const models = [
  'Role', 'TaxCode', 'BillSundry', 'Unit', 'ItemGroup', 
  'Warehouse', 'WarehouseBin', 'PaymentMethod', 'SaleType', 'PurchaseType'
];

models.forEach(model => {
  const regex = new RegExp(`(model ${model} {[\\s\\S]*?)(createdAt DateTime)`, 'g');
  if (content.match(regex)) {
    content = content.replace(regex, `$1  sortOrder Int @default(0)\n  $2`);
    console.log(`Updated ${model}`);
  } else {
    console.log(`Failed to match ${model}`);
  }
});

fs.writeFileSync(path, content);
