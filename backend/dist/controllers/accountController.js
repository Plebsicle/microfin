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
const prismaInstance_1 = __importDefault(require("../database/prisma/prismaInstance"));
function accountController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.session.user) {
            res.status(401).json({ message: "user not logged in " });
            return;
        }
        const newAccountNumber = (0, accountGeneration_1.generateAccountNumber)();
        const newAccount = yield prismaInstance_1.default.account.create({
            data: {
                accountNumber: newAccountNumber,
                userId: req.session.user.id
            }
        });
        res.status(200).json({ message: "New Account Created Succesfully",
            accountNumber: newAccount.accountNumber, balance: newAccount.balance
        });
        return;
    });
}
exports.default = accountController;
