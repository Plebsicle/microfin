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
const accountGeneration_1 = require("../utility/accountGeneration");
const db_1 = __importDefault(require("../database/db"));
const cache_service_1 = require("../config/redis/cache.service");
function accountController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.session.user) {
            res.status(401).json({ message: "User not logged in" });
            return;
        }
        const newAccountNumber = (0, accountGeneration_1.generateAccountNumber)();
        try {
            const query = `INSERT INTO "Account" (accountNumber, userId) VALUES ($1, $2) RETURNING accountNumber, balance`;
            const values = [newAccountNumber, req.session.user.id];
            const result = yield db_1.default.query(query, values);
            const newAccount = result.rows[0];
            res.status(200).json({
                message: "New Account Created Successfully",
                accountNumber: newAccount.accountNumber,
                balance: newAccount.balance
            });
            (0, cache_service_1.updateAccountCache)(newAccount.accountNumber);
        }
        catch (error) {
            console.error("Error creating new account:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });
}
exports.default = accountController;
