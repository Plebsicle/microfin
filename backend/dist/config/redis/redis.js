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
exports.redisCluster = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
// Singleton instance
let redisClusterInstance = null;
let isConnected = false;
function getRedisCluster() {
    if (!redisClusterInstance) {
        redisClusterInstance = new ioredis_1.default.Cluster([
            { host: "localhost", port: 6379 }, // Master 1
            { host: "localhost", port: 6380 }, // Master 2 
            { host: "localhost", port: 6381 }, // Master 3
        ], {
            scaleReads: "master",
            redisOptions: {
                connectTimeout: 10000,
            },
            // This is critical - it tells ioredis how to map the internal IPs that Redis nodes announce
            // to the localhost ports you can actually connect to
            natMap: {
                "192.168.1.2:6379": { host: "localhost", port: 6379 },
                "192.168.1.3:6379": { host: "localhost", port: 6380 },
                "192.168.1.4:6379": { host: "localhost", port: 6381 },
                "192.168.1.5:6379": { host: "localhost", port: 6382 },
                "192.168.1.6:6379": { host: "localhost", port: 6383 },
                "192.168.1.7:6379": { host: "localhost", port: 6384 },
                "192.168.1.8:6379": { host: "localhost", port: 6385 },
                "192.168.1.9:6379": { host: "localhost", port: 6386 },
                "192.168.1.10:6379": { host: "localhost", port: 6387 }
            },
            enableReadyCheck: true,
            enableOfflineQueue: true,
            maxRedirections: 16,
            retryDelayOnFailover: 2000,
            retryDelayOnClusterDown: 1000,
            clusterRetryStrategy: (times) => {
                console.error(`⚠️ Redis Cluster retry #${times}`);
                if (times > 5)
                    return null; // Fail after 5 retries
                return Math.min(100 + times * 200, 2000);
            }
        });
        redisClusterInstance.on("connect", () => {
            if (!isConnected) {
                console.log("✅ Connected to Redis Cluster");
                isConnected = true;
            }
        });
        redisClusterInstance.on("error", (err) => {
            console.error("❌ Redis Cluster Error:", err);
        });
        redisClusterInstance.on("node error", (err) => {
            console.error("🚨 Redis Node Error:", err);
        });
        redisClusterInstance.on("end", () => {
            console.error("❌ Redis Cluster Connection Lost");
            isConnected = false;
        });
    }
    return redisClusterInstance;
}
const redisCluster = getRedisCluster();
exports.redisCluster = redisCluster;
// ✅ Debug: Test Redis Write & Read
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redisCluster.set("test_key", "test_value", "EX", 60);
        const value = yield redisCluster.get("test_key");
        console.log("🔹 Test Key Value:", value);
    }
    catch (error) {
        console.error("❌ Redis Write Error:", error);
    }
}))();
