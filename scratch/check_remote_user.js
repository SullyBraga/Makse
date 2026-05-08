const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@makse.com.br';
  const user = await prisma.user.findUnique({
    where: { email },
  });
  console.log('User found:', user ? 'Yes' : 'No');
  if (user) {
    console.log('User ID:', user.id);
    console.log('User Email:', JSON.stringify(user.email)); // check for hidden chars
    console.log('User Role:', user.role);
  }
}

main().finally(() => prisma.$disconnect());
