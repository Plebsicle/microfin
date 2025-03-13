import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Modify DATABASE_URL to ensure connection pooling is used
const databaseUrl = process.env.DATABASE_URL 
    ? `${process.env.DATABASE_URL}&pgbouncer=true&connection_limit=100`
    : "";

const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: ['query', 'info', 'warn', 'error'], // Enable query logging for debugging
});

// Gracefully handle Prisma disconnection issues
process.on('beforeExit', async () => {
    console.log("Prisma is disconnecting...");
    await prisma.$disconnect();
});

export default prisma;
