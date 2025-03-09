import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const prisma = new PrismaClient();

export default prisma;