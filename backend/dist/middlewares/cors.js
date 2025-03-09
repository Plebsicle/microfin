"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const whitelist = new Set(["http://localhost:5173"]);
const corsOptions = {
    optionsSuccessStatus: 200, // ✅ Corrected property name
    origin: (origin, callback) => {
        if (!origin || whitelist.has(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not Allowed By CORS"));
        }
    },
    credentials: true,
};
exports.default = (0, cors_1.default)(corsOptions);
