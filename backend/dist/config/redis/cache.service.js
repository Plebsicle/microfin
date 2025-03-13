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
exports.updateAccountCache = exports.getAccountFromCache = void 0;
const redis_1 = require("./redis");
const prismaInstance_1 = __importDefault(require("../../database/prisma/prismaInstance"));
let redisCluster;
(() => __awaiter(void 0, void 0, void 0, function* () {
    redisCluster = yield (0, redis_1.getRedisCluster)();
}))();
const getAccountFromCache = (accountNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const cachedData = yield redisCluster.get(`account:${accountNumber}`);
    if (cachedData)
        return JSON.parse(cachedData);
    const account = yield prismaInstance_1.default.account.findUnique({
        where: { accountNumber }
    });
    if (account) {
        yield redisCluster.set(`account:${accountNumber}`, JSON.stringify(account), 'EX', 300); // Cache for 5 minutes
    }
    return account;
});
exports.getAccountFromCache = getAccountFromCache;
const updateAccountCache = (accountNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedAccount = yield prismaInstance_1.default.account.findUnique({
        where: { accountNumber }
    });
    if (updatedAccount) {
        yield redisCluster.set(`account:${accountNumber}`, JSON.stringify(updatedAccount), 'EX', 300);
    }
});
exports.updateAccountCache = updateAccountCache;
