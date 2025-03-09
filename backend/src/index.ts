import express from 'express'
import sessionMiddleware from './middlewares/session';
import signupRoute from './routes/signup'
import cors from './middlewares/cors';
import dotenv from 'dotenv'
import path from 'path';
import accountRoute from './routes/account'
import { initializeProducer, disconnectProducer } from './config/kafka/producer';
import { initializeConsumer, disconnectConsumer } from './config/kafka/consumer';


dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const PORT = process.env.PORT || 8000;
async function initializeKafka() {
    try {
      await initializeProducer();
      await initializeConsumer();
      console.log('Kafka services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Kafka services:', error);
      process.exit(1);
    }
  }

  async function gracefulShutdown() {
    console.log('Shutting down services...');
    try {
      await disconnectConsumer();
      await disconnectProducer();
      console.log('All connections closed successfully');
    } catch (error) {
      console.error('Error during shutdown:', error);
    } finally {
      process.exit(0);
    }
  }

const app = express();
app.use(express.json());
app.use(cors);


app.use(sessionMiddleware)

app.use(signupRoute);
app.use(accountRoute);
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