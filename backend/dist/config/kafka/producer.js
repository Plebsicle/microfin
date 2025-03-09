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
exports.disconnectProducer = exports.getProducer = exports.initializeProducer = void 0;
const kafka_1 = require("./kafka");
let producer;
const initializeProducer = () => __awaiter(void 0, void 0, void 0, function* () {
    producer = kafka_1.kafka.producer({
        idempotent: true, // only publish a message once
        maxInFlightRequests: 1,
        retry: { retries: 5 }
    });
    yield producer.connect();
    console.log('Kafka producer connected');
    return producer;
});
exports.initializeProducer = initializeProducer;
const getProducer = () => {
    if (!producer) {
        throw new Error('Producer not initialized');
    }
    return producer;
};
exports.getProducer = getProducer;
const disconnectProducer = () => __awaiter(void 0, void 0, void 0, function* () {
    if (producer) {
        yield producer.disconnect();
        console.log('Kafka producer disconnected');
    }
});
exports.disconnectProducer = disconnectProducer;
