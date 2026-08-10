import prisma from './src/config/prisma.js';

const cols = await prisma.$queryRaw`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'vendor_verifications'
  ORDER BY ordinal_position;
`;

console.log('=== Colunas de vendor_verifications ===');
cols.forEach(c => console.log(`  ${c.column_name}  (${c.data_type})`));

await prisma.$disconnect();
