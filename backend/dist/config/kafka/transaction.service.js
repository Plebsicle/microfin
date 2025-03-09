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
exports.updateTransactionStatus = exports.publishTransaction = void 0;
const producer_1 = require("./producer");
const kafka_1 = require("./kafka");
const prismaInstance_1 = __importDefault(require("../../database/prisma/prismaInstance"));
const publishTransaction = (data, key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const producer = (0, producer_1.getProducer)();
        yield producer.send({
            topic: kafka_1.FINANCIAL_TOPIC,
            messages: [
                {
                    key,
                    value: JSON.stringify(Object.assign({}, data))
                }
            ],
        });
        return true;
    }
    catch (error) {
        console.error('Error publishing to Kafka:', error);
        return false;
    }
});
exports.publishTransaction = publishTransaction;
const updateTransactionStatus = (transactionId, status) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prismaInstance_1.default.transaction.update({
            where: { id: transactionId },
            data: { status }
        });
    }
    catch (error) {
        console.error('Error updating transaction status:', error);
    }
});
exports.updateTransactionStatus = updateTransactionStatus;
