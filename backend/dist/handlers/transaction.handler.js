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
const db_1 = __importDefault(require("../database/db"));
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
        const client = yield db_1.default.connect();
        try {
            yield client.query('BEGIN');
            yield client.query('UPDATE "Account" SET balance = balance - $1 WHERE accountNumber = $2', [data.amount, data.accountNumber]);
            yield client.query('INSERT INTO "Transaction" (id, type, amount, "senderAccountId", status) VALUES ($1, $2, $3, $4, $5)', [data.transactionId, 'WITHDRAWAL', data.amount, data.accountId, 'COMPLETED']);
            yield client.query('COMMIT');
            console.log(data.amount, 'Withdrew Successfully');
            yield (0, cache_service_1.updateAccountCache)(data.accountNumber);
        }
        catch (error) {
            yield client.query('ROLLBACK');
            console.error('Error processing withdrawal:', error);
            yield (0, transaction_service_1.updateTransactionStatus)(data.transactionId, 'FAILED');
        }
        finally {
            client.release();
        }
    });
}
function processDeposit(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield db_1.default.connect();
        try {
            yield client.query('BEGIN');
            yield client.query('UPDATE "Account" SET balance = balance + $1 WHERE accountNumber = $2', [data.amount, data.accountNumber]);
            yield client.query('INSERT INTO "Transaction" (id, type, amount, "receiverAccountId", status) VALUES ($1, $2, $3, $4, $5)', [data.transactionId, 'DEPOSIT', data.amount, data.accountId, 'COMPLETED']);
            yield client.query('COMMIT');
            console.log(data.amount, 'Deposited Successfully');
            yield (0, cache_service_1.updateAccountCache)(data.accountNumber);
        }
        catch (error) {
            yield client.query('ROLLBACK');
            console.error('Error processing deposit:', error);
            yield (0, transaction_service_1.updateTransactionStatus)(data.transactionId, 'FAILED');
        }
        finally {
            client.release();
        }
    });
}
function processTransfer(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield db_1.default.connect();
        try {
            yield client.query('BEGIN');
            yield client.query('UPDATE "Account" SET balance = balance - $1 WHERE accountNumber = $2', [data.amount, data.senderAccountNumber]);
            yield client.query('UPDATE "Account" SET balance = balance + $1 WHERE accountNumber = $2', [data.amount, data.receiverAccountNumber]);
            yield client.query('INSERT INTO "Transaction" (id, type, amount, "senderAccountId", "receiverAccountId", status) VALUES ($1, $2, $3, $4, $5, $6)', [data.transactionId, 'TRANSFER', data.amount, data.senderAccountId, data.receiverAccountId, 'COMPLETED']);
            yield client.query('COMMIT');
            console.log(data.amount, 'Transferred Successfully');
            yield (0, cache_service_1.updateAccountCache)(data.senderAccountNumber);
            yield (0, cache_service_1.updateAccountCache)(data.receiverAccountNumber);
        }
        catch (error) {
            yield client.query('ROLLBACK');
            console.error('Error processing transfer:', error);
            yield (0, transaction_service_1.updateTransactionStatus)(data.transactionId, 'FAILED');
        }
        finally {
            client.release();
        }
    });
}
