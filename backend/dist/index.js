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
const express_1 = __importDefault(require("express"));
const session_1 = __importDefault(require("./middlewares/session"));
const signup_1 = __importDefault(require("./routes/signup"));
const cors_1 = __importDefault(require("./middlewares/cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const account_1 = __importDefault(require("./routes/account"));
const producer_1 = require("./config/kafka/producer");
const consumer_1 = require("./config/kafka/consumer");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const PORT = process.env.PORT || 8000;
function initializeKafka() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, producer_1.initializeProducer)();
            yield (0, consumer_1.initializeConsumer)();
            console.log('Kafka services initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Kafka services:', error);
            process.exit(1);
        }
    });
}
function gracefulShutdown() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Shutting down services...');
        try {
            yield (0, consumer_1.disconnectConsumer)();
            yield (0, producer_1.disconnectProducer)();
            console.log('All connections closed successfully');
        }
        catch (error) {
            console.error('Error during shutdown:', error);
        }
        finally {
            process.exit(0);
        }
    });
}
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(cors_1.default);
app.use(session_1.default);
app.use(signup_1.default);
app.use(account_1.default);
app.use((req, res, next) => {
    console.log(`Worker ${process.pid} handling request to ${req.url}`);
    next();
});
initializeKafka();
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
app.disable('x-powered-by');
app.get("/", (req, res) => {
    console.log(`Request handled by worker ${process.pid}`);
    res.send(`Hello from worker ${process.pid}`);
});
app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started on port ${PORT}`);
});
