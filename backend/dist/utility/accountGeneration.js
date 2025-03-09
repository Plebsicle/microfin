"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccountNumber = generateAccountNumber;
exports.generateTransactionId = generateTransactionId;
const uuid_1 = require("uuid");
function generateAccountNumber() {
    const numericAccountNumber = (0, uuid_1.v4)().replace(/\D/g, '').slice(0, 12);
    return numericAccountNumber;
}
function generateTransactionId() {
    const numericAccountNumber = (0, uuid_1.v4)().replace(/\D/g, '').slice(0, 25);
    return numericAccountNumber;
}
