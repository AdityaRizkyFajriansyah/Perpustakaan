require("dotenv").config();
const prisma = require("../src/config/prisma");

async function main() {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  console.log(admins);
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
