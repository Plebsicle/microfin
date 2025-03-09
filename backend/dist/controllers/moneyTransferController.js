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
exports.depositController = depositController;
exports.transferController = transferController;
exports.withdrawController = withdrawController;
const prismaInstance_1 = __importDefault(require("../database/prisma/prismaInstance"));
const zodValidation_1 = require("../utility/zodValidation");
const redis_1 = require("../config/redis/redis");
function getAccountFromCache(accountNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const cachedData = yield redis_1.redisCluster.get(`account:${accountNumber}`);
        if (cachedData)
            return JSON.parse(cachedData);
        const account = yield prismaInstance_1.default.account.findUnique({
            where: { accountNumber }
        });
        if (account) {
            yield redis_1.redisCluster.set(`account:${accountNumber}`, JSON.stringify(account), 'EX', 300); // Cache for 5 minutes
        }
        return account;
    });
}
function updateAccountCache(accountNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const updatedAccount = yield prismaInstance_1.default.account.findUnique({
            where: { accountNumber }
        });
        if (updatedAccount) {
            yield redis_1.redisCluster.set(`account:${accountNumber}`, JSON.stringify(updatedAccount), 'EX', 300);
        }
    });
}
function withdrawController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.session.user) {
            res.status(401).json({ message: "User not logged in" });
            return;
        }
        const { amount, accountNumber } = req.body;
        const parsedAmount = Number(amount);
        const parsedAccountNumber = String(accountNumber);
        if (parsedAmount <= 0) {
            res.status(400).json({ message: "Invalid Withdrawal Amount" });
            return;
        }
        const validationResult = yield (0, zodValidation_1.amountValidation)(parsedAmount, parsedAccountNumber);
        if (!validationResult) {
            res.status(400).json({ message: "Invalid Input Amount or Account Number" });
            return;
        }
        try {
            const account = yield getAccountFromCache(parsedAccountNumber);
            if (!account) {
                res.status(404).json({ message: "Account not found" });
                return;
            }
            if (Number(account.balance) < parsedAmount) {
                res.status(400).json({ message: "Insufficient balance" });
                return;
            }
            yield prismaInstance_1.default.$transaction((prisma) => __awaiter(this, void 0, void 0, function* () {
                yield prisma.account.update({
                    where: { accountNumber: parsedAccountNumber },
                    data: { balance: { decrement: parsedAmount } }
                });
                yield prisma.transaction.create({
                    data: {
                        type: 'WITHDRAWAL',
                        amount: parsedAmount,
                        senderAccountId: account.id
                    }
                });
            }));
            yield updateAccountCache(parsedAccountNumber);
            res.status(200).json({ message: "Amount Withdrawn Successfully" });
        }
        catch (error) {
            console.error("Withdrawal Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });
}
function transferController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.session.user) {
            res.status(401).json({ message: "User not logged in" });
            return;
        }
        const { amount, senderAccountNumber, receiverAccountNumber } = req.body;
        const parsedAmount = Number(amount);
        if (parsedAmount <= 0) {
            res.status(400).json({ message: "Transfer amount must be greater than zero" });
            return;
        }
        const validationResult = yield (0, zodValidation_1.amountTransferValidation)(parsedAmount, senderAccountNumber, receiverAccountNumber);
        if (!validationResult) {
            res.status(400).json({ message: "Invalid Transfer Details" });
            return;
        }
        try {
            const senderAccount = yield getAccountFromCache(senderAccountNumber);
            const receiverAccount = yield getAccountFromCache(receiverAccountNumber);
            if (!senderAccount) {
                res.status(404).json({ message: "Sender account not found" });
                return;
            }
            if (!receiverAccount) {
                res.status(404).json({ message: "Receiver account not found" });
                return;
            }
            if (Number(senderAccount.balance) < parsedAmount) {
                res.status(400).json({ message: "Sender does not have enough balance" });
                return;
            }
            yield prismaInstance_1.default.$transaction((prisma) => __awaiter(this, void 0, void 0, function* () {
                yield prisma.account.update({
                    where: { accountNumber: senderAccountNumber },
                    data: { balance: { decrement: parsedAmount } }
                });
                yield prisma.account.update({
                    where: { accountNumber: receiverAccountNumber },
                    data: { balance: { increment: parsedAmount } }
                });
                yield prisma.transaction.create({
                    data: {
                        type: 'TRANSFER',
                        amount: parsedAmount,
                        receiverAccountId: receiverAccount.id,
                        senderAccountId: senderAccount.id
                    }
                });
            }));
            yield updateAccountCache(senderAccountNumber);
            yield updateAccountCache(receiverAccountNumber);
            res.status(200).json({ message: "Amount Transferred Successfully" });
        }
        catch (error) {
            console.error("Transfer Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });
}
// Deposit Controller
function depositController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.session.user) {
            res.status(401).json({ message: "User not logged in" });
            return;
        }
        const { amount, accountNumber } = req.body;
        const parsedAmount = Number(amount);
        const parsedAccountNumber = String(accountNumber);
        if (parsedAmount <= 0) {
            res.status(400).json({ message: "Deposit amount must be greater than zero" });
            return;
        }
        const validationResult = yield (0, zodValidation_1.amountValidation)(parsedAmount, parsedAccountNumber);
        if (!validationResult) {
            res.status(400).json({ message: "Invalid Input Amount" });
            return;
        }
        try {
            const account = yield getAccountFromCache(parsedAccountNumber);
            if (!account) {
                res.status(404).json({ message: "Account not found" });
                return;
            }
            yield prismaInstance_1.default.$transaction((prisma) => __awaiter(this, void 0, void 0, function* () {
                yield prisma.account.update({
                    where: { accountNumber: parsedAccountNumber },
                    data: { balance: { increment: parsedAmount } }
                });
                yield prisma.transaction.create({
                    data: {
                        type: 'DEPOSIT',
                        amount: parsedAmount,
                        receiverAccountId: account.id
                    }
                });
            }));
            yield updateAccountCache(parsedAccountNumber);
            res.status(200).json({ message: "Amount Deposited Successfully" });
        }
        catch (error) {
            console.error("Deposit Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });
}
