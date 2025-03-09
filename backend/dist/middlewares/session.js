"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_session_1 = __importDefault(require("express-session"));
const connect_redis_1 = require("connect-redis");
const redis_1 = require("../config/redis/redis");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const redisStore = new connect_redis_1.RedisStore({
    client: redis_1.redisCluster,
    disableTouch: false,
});
const sessionMiddleware = (0, express_session_1.default)({
    store: redisStore,
    secret: process.env.SESSION_SECRET,
    name: "sessionId",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Secure in production
        httpOnly: true, // Prevent client-side access
        maxAge: 1000 * 60 * 60, // 1 hour expiration
    },
});
exports.default = sessionMiddleware;
