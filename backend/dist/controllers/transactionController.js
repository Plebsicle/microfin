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
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawController = withdrawController;
exports.transferController = transferController;
exports.depositController = depositController;
const zodValidation_1 = require("../utility/zodValidation");
const transaction_service_1 = require("../config/kafka/transaction.service");
const accountGeneration_1 = require("../utility/accountGeneration");
const account_service_1 = require("../services/account.service");
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
            const { eligible, account, message } = yield (0, account_service_1.verifyWithdrawalEligibility)(parsedAccountNumber, parsedAmount);
            if (!eligible) {
                res.status(400).json({ message });
                return;
            }
            // Publish withdrawal transaction to Kafka
            const transactionId = (0, accountGeneration_1.generateTransactionId)();
            const published = yield (0, transaction_service_1.publishTransaction)({
                transactionId,
                type: 'WITHDRAWAL',
                amount: parsedAmount,
                accountNumber: parsedAccountNumber,
                accountId: account.id,
                userId: req.session.user.id
            }, parsedAccountNumber); // Using account number as the key for partitioning
            if (published) {
                res.status(202).json({ message: "Withdrawal request accepted" });
                return;
            }
            else {
                res.status(500).json({ message: "Failed to process withdrawal" });
                return;
            }
        }
        catch (error) {
            console.error("Withdrawal Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
            return;
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
            const { eligible, senderAccount, receiverAccount, message } = yield (0, account_service_1.verifyTransferEligibility)(senderAccountNumber, receiverAccountNumber, parsedAmount);
            if (!eligible) {
                res.status(400).json({ message });
                return;
            }
            // Publish transfer transaction to Kafka
            const transactionId = (0, accountGeneration_1.generateTransactionId)();
            const published = yield (0, transaction_service_1.publishTransaction)({
                transactionId,
                type: 'TRANSFER',
                amount: parsedAmount,
                senderAccountNumber,
                receiverAccountNumber,
                senderAccountId: senderAccount.id,
                receiverAccountId: receiverAccount.id,
                userId: req.session.user.id
            }, senderAccountNumber); // Using sender account number as the key for partitioning
            if (published) {
                res.status(202).json({ message: "Transfer request accepted" });
                return;
            }
            else {
                res.status(500).json({ message: "Failed to process transfer" });
                return;
            }
        }
        catch (error) {
            console.error("Transfer Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
            return;
        }
    });
}
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
            const { eligible, account, message } = yield (0, account_service_1.verifyDepositEligibility)(parsedAccountNumber);
            if (!eligible) {
                res.status(400).json({ message });
                return;
            }
            // Publish deposit transaction to Kafka
            const transactionId = (0, accountGeneration_1.generateTransactionId)();
            const published = yield (0, transaction_service_1.publishTransaction)({
                transactionId,
                type: 'DEPOSIT',
                amount: parsedAmount,
                accountNumber: parsedAccountNumber,
                accountId: account.id,
                userId: req.session.user.id
            }, parsedAccountNumber); // Using account number as the key for partitioning
            if (published) {
                res.status(202).json({ message: "Deposit request accepted" });
                return;
            }
            else {
                res.status(500).json({ message: "Failed to process deposit" });
                return;
            }
        }
        catch (error) {
            console.error("Deposit Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
            return;
        }
    });
}
