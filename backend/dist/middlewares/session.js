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
const express_session_1 = __importDefault(require("express-session"));
const connect_redis_1 = require("connect-redis");
const redis_1 = require("../config/redis/redis");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../.env") });
function createRedisStore() {
    return __awaiter(this, void 0, void 0, function* () {
        const redisClient = yield (0, redis_1.getRedisCluster)(); // Ensure the client is acquired
        return new connect_redis_1.RedisStore({
            client: redisClient,
            disableTouch: false,
        });
    });
}
const sessionMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const redisStore = yield createRedisStore();
    (0, express_session_1.default)({
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
    })(req, res, next);
});
exports.default = sessionMiddleware;
