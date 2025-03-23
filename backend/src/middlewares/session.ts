import session from "express-session";
import { RedisStore } from "connect-redis";
import { redisCluster } from "../config/redis/redis";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const redisStore = new RedisStore({
  client: redisCluster,
  disableTouch: false,
});

const sessionMiddleware = session({
  store: redisStore,
  secret: process.env.SESSION_SECRET as string,
  name: "sessionId",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Secure in production
    httpOnly: true, // Prevent client-side access
    maxAge: 1000 * 60 * 30, // 1/2 hour expiration
  },
});

export default sessionMiddleware;