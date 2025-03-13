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
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const session_1 = __importDefault(require("./middlewares/session"));
const signup_1 = __importDefault(require("./routes/signup"));
const account_1 = __importDefault(require("./routes/account"));
const cors_1 = __importDefault(require("cors")); // Ensure cors is properly used
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const producer_1 = require("./config/kafka/producer");
const consumer_1 = require("./config/kafka/consumer");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../.env") });
// const BACKLOG = 65535;
//process.env.UV_THREADPOOL_SIZE = String(Math.max(8, require("os").cpus().length * 2));
const PORT = Number(process.env.PORT) || 8000;
const app = (0, express_1.default)();
exports.app = app;
app.use(express_1.default.json());
app.use((0, cors_1.default)()); // ✅ Fixed: Ensure CORS is correctly initialized
// Attach session middleware
app.use(session_1.default);
// API Routes
app.use(signup_1.default);
app.use(account_1.default);
// ✅ Kafka Initialization (Uncomment if needed)
function initializeKafka() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, producer_1.initializeProducer)();
            yield (0, consumer_1.initializeConsumer)();
            console.log("Kafka services initialized successfully");
        }
        catch (error) {
            console.error("Failed to initialize Kafka services:", error);
            process.exit(1);
        }
    });
}
function gracefulShutdown() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Shutting down services...");
        try {
            yield (0, consumer_1.disconnectConsumer)();
            yield (0, producer_1.disconnectProducer)();
            console.log("All connections closed successfully");
        }
        catch (error) {
            console.error("Error during shutdown:", error);
        }
        finally {
            process.exit(0);
        }
    });
}
// ✅ Ensure Kafka starts if needed
// initializeKafka();
// process.on("SIGTERM", gracefulShutdown);
// process.on("SIGINT", gracefulShutdown);
// Disable "X-Powered-By" header for security
app.disable("x-powered-by");
// Start Express Server
const server = app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started on port ${PORT}`);
});
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.requestTimeout = 60000;
server.maxHeadersCount = 16384;
