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
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
const argon2_1 = __importDefault(require("argon2"));
function hashPassword(password) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield argon2_1.default.hash(password, {
            type: argon2_1.default.argon2id,
            memoryCost: 4096, // Memory usage (higher = more secure)
            timeCost: 3, // Number of iterations
            parallelism: 1 // Threads (higher = faster)
        });
    });
}
function comparePassword(password, hashedPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield argon2_1.default.verify(hashedPassword, password);
    });
}
