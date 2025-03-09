"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONSUMER_GROUP_ID = exports.FINANCIAL_TOPIC = exports.kafka = void 0;
const kafkajs_1 = require("kafkajs");
const kafkaConfig = {
    clientId: 'financial-service',
    brokers: ['localhost:19094', 'localhost:19096', 'localhost:19098']
};
exports.kafka = new kafkajs_1.Kafka(kafkaConfig);
exports.FINANCIAL_TOPIC = 'financial-transactions';
exports.CONSUMER_GROUP_ID = 'financial-transaction-group';
