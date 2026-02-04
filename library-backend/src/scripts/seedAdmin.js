require("dotenv").config();
const prisma = require("../src/config/prisma");
const bcrypt = require("bcrypt");

async function main() {
  const email = "admin@library.com";

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log("Admin already exists:", email);
    return;
  }

  const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

  await prisma.user.create({
    data: {
      name: "Admin",
      email,
      password: hashed,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin created:", email);
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
