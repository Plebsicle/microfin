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
exports.disconnectConsumer = exports.getConsumer = exports.initializeConsumer = void 0;
const kafka_1 = require("./kafka");
const transaction_handler_1 = require("../../handlers/transaction.handler");
let consumer;
const initializeConsumer = () => __awaiter(void 0, void 0, void 0, function* () {
    consumer = kafka_1.kafka.consumer({
        groupId: kafka_1.CONSUMER_GROUP_ID,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxBytesPerPartition: 1048576, // 1MB
        readUncommitted: false // Only read committed transactions
    });
    yield consumer.connect();
    yield consumer.subscribe({
        topic: kafka_1.FINANCIAL_TOPIC,
        fromBeginning: false
    });
    yield consumer.run({
        eachMessage: (_a) => __awaiter(void 0, [_a], void 0, function* ({ topic, partition, message }) {
            try {
                const transactionData = JSON.parse(message.value.toString());
                console.log(`Processing transaction: ${transactionData.transactionId}`);
                // Process the transaction
                yield (0, transaction_handler_1.processTransaction)(transactionData);
            }
            catch (error) {
                console.error('Error processing Kafka message:', error);
                // Could implement dead letter queue here
            }
        }),
    });
    console.log('Kafka consumer started');
    return consumer;
});
exports.initializeConsumer = initializeConsumer;
const getConsumer = () => {
    if (!consumer) {
        throw new Error('Consumer not initialized');
    }
    return consumer;
};
exports.getConsumer = getConsumer;
const disconnectConsumer = () => __awaiter(void 0, void 0, void 0, function* () {
    if (consumer) {
        yield consumer.disconnect();
        console.log('Kafka consumer disconnected');
    }
});
exports.disconnectConsumer = disconnectConsumer;
