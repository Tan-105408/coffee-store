const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ SQL Server connected successfully via Prisma");
  } catch (error) {
    console.error(`❌ Error connecting to SQL Server: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.prisma = prisma;
