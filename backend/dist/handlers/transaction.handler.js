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
exports.processTransaction = void 0;
const prismaInstance_1 = __importDefault(require("../database/prisma/prismaInstance"));
const cache_service_1 = require("../config/redis/cache.service");
const transaction_service_1 = require("../config/kafka/transaction.service");
const processTransaction = (transaction) => __awaiter(void 0, void 0, void 0, function* () {
    switch (transaction.type) {
        case 'WITHDRAWAL':
            yield processWithdrawal(transaction);
            break;
        case 'DEPOSIT':
            yield processDeposit(transaction);
            break;
        case 'TRANSFER':
            yield processTransfer(transaction);
            break;
        default:
            console.error(`Unknown transaction type: ${transaction.type}`);
    }
});
exports.processTransaction = processTransaction;
function processWithdrawal(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prismaInstance_1.default.$transaction((prisma) => __awaiter(this, void 0, void 0, function* () {
                yield prisma.account.update({
                    where: { accountNumber: data.accountNumber },
                    data: { balance: { decrement: data.amount } }
                });
                yield prisma.transaction.create({
                    data: {
                        id: data.transactionId,
                        type: 'WITHDRAWAL',
                        amount: data.amount,
                        senderAccountId: data.accountId,
                        status: 'COMPLETED',
                    }
                });
            }));
            yield (0, cache_service_1.updateAccountCache)(data.accountNumber);
        }
        catch (error) {
            console.error('Error processing withdrawal:', error);
            yield (0, transaction_service_1.updateTransactionStatus)(data.transactionId, 'FAILED');
        }
    });
}
function processDeposit(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prismaInstance_1.default.$transaction((prisma) => __awaiter(this, void 0, void 0, function* () {
                yield prisma.account.update({
                    where: { accountNumber: data.accountNumber },
                    data: { balance: { increment: data.amount } }
                });
                yield prisma.transaction.create({
                    data: {
                        id: data.transactionId,
                        type: 'DEPOSIT',
                        amount: data.amount,
                        receiverAccountId: data.accountId,
                        status: 'COMPLETED',
                    }
                });
            }));
            yield (0, cache_service_1.updateAccountCache)(data.accountNumber);
        }
        catch (error) {
            console.error('Error processing deposit:', error);
            yield (0, transaction_service_1.updateTransactionStatus)(data.transactionId, 'FAILED');
        }
    });
}
function processTransfer(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prismaInstance_1.default.$transaction((prisma) => __awaiter(this, void 0, void 0, function* () {
                yield prisma.account.update({
                    where: { accountNumber: data.senderAccountNumber },
                    data: { balance: { decrement: data.amount } }
                });
                yield prisma.account.update({
                    where: { accountNumber: data.receiverAccountNumber },
                    data: { balance: { increment: data.amount } }
                });
                yield prisma.transaction.create({
                    data: {
                        id: data.transactionId,
                        type: 'TRANSFER',
                        amount: data.amount,
                        receiverAccountId: data.receiverAccountId,
                        senderAccountId: data.senderAccountId,
                        status: 'COMPLETED',
                    }
                });
            }));
            yield (0, cache_service_1.updateAccountCache)(data.senderAccountNumber);
            yield (0, cache_service_1.updateAccountCache)(data.receiverAccountNumber);
        }
        catch (error) {
            console.error('Error processing transfer:', error);
            yield (0, transaction_service_1.updateTransactionStatus)(data.transactionId, 'FAILED');
        }
    });
}
