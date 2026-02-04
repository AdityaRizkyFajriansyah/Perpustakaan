require("dotenv").config();
const prisma = require("../src/config/prisma");
const bcrypt = require("bcrypt");

async function main() {
  const email = "student@library.com";

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log("Student already exists:", email);
    return;
  }

  const hashed = await bcrypt.hash(process.env.STUDENT_PASSWORD, 12);

  await prisma.user.create({
    data: {
      name: "Student",
      email,
      password: hashed,
      role: "STUDENT",
    },
  });

  console.log("✅ Student created:", email);
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
