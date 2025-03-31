import express from "express";
import sessionMiddleware from "./middlewares/session";
import signupRoute from "./routes/signup";
import accountRoute from "./routes/account";
import cors from "cors"; // Ensure cors is properly used
import dotenv from "dotenv";
import path from "path";
import { initializeProducer, disconnectProducer } from "./config/kafka/producer";
import { initializeConsumer, disconnectConsumer } from "./config/kafka/consumer";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const PORT = Number(process.env.PORT) || 8000;

const app = express();
app.use(express.json());
app.use(cors());


// Attach session middleware
app.use(sessionMiddleware);

// API Routes
app.use(signupRoute);
app.use(accountRoute);


async function initializeKafka() {
    try {
        await initializeProducer();
        await initializeConsumer();
        console.log("Kafka services initialized successfully");
    } catch (error) {
        console.error("Failed to initialize Kafka services:", error);
        process.exit(1);
    }
}

async function gracefulShutdown() {
    console.log("Shutting down services...");
    try {
        await disconnectConsumer();
        await disconnectProducer();
        console.log("All connections closed successfully");
    } catch (error) {
        console.error("Error during shutdown:", error);
    } finally {
        process.exit(0);
    }
}


initializeKafka();
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Disable "X-Powered-By" header for security
app.disable("x-powered-by");

// Start Express Server
const server = app.listen(PORT,() => {
    console.log(`Worker ${process.pid} started on port ${PORT}`);
});

server.keepAliveTimeout = 65000;    
server.headersTimeout = 66000; 
server.requestTimeout = 60000;
server.maxHeadersCount = 16384;


export { app };