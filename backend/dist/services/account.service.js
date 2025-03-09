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
exports.verifyDepositEligibility = exports.verifyTransferEligibility = exports.verifyWithdrawalEligibility = void 0;
const cache_service_1 = require("../config/redis/cache.service");
const verifyWithdrawalEligibility = (accountNumber, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const account = yield (0, cache_service_1.getAccountFromCache)(accountNumber);
    if (!account) {
        return { eligible: false, message: "Account not found" };
    }
    if (Number(account.balance) < amount) {
        return { eligible: false, message: "Insufficient balance" };
    }
    return { eligible: true, account };
});
exports.verifyWithdrawalEligibility = verifyWithdrawalEligibility;
const verifyTransferEligibility = (senderAccountNumber, receiverAccountNumber, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const senderAccount = yield (0, cache_service_1.getAccountFromCache)(senderAccountNumber);
    if (!senderAccount) {
        return { eligible: false, message: "Sender account not found" };
    }
    const receiverAccount = yield (0, cache_service_1.getAccountFromCache)(receiverAccountNumber);
    if (!receiverAccount) {
        return { eligible: false, message: "Receiver account not found" };
    }
    if (Number(senderAccount.balance) < amount) {
        return { eligible: false, message: "Sender does not have enough balance" };
    }
    return { eligible: true, senderAccount, receiverAccount };
});
exports.verifyTransferEligibility = verifyTransferEligibility;
const verifyDepositEligibility = (accountNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const account = yield (0, cache_service_1.getAccountFromCache)(accountNumber);
    if (!account) {
        return { eligible: false, message: "Account not found" };
    }
    return { eligible: true, account };
});
exports.verifyDepositEligibility = verifyDepositEligibility;
