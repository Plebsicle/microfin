"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
// Modify DATABASE_URL to ensure connection pooling is used
const databaseUrl = process.env.DATABASE_URL
    ? `${process.env.DATABASE_URL}&pgbouncer=true&connection_limit=100`
    : "";
const prisma = new client_1.PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: ['query', 'info', 'warn', 'error'], // Enable query logging for debugging
});
// Gracefully handle Prisma disconnection issues
process.on('beforeExit', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Prisma is disconnecting...");
    yield prisma.$disconnect();
}));
exports.default = prisma;
