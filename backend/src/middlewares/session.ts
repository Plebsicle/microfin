import session from "express-session";
import { RedisStore } from "connect-redis";
import { getRedisCluster } from "../config/redis/redis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function createRedisStore() {
  const redisClient = await getRedisCluster(); // Ensure the client is acquired
  return new RedisStore({
    client: redisClient,
    disableTouch: false,
  });
}

const sessionMiddleware = async (req : any, res:any ,next : any) => {
  const redisStore = await createRedisStore();

  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET as string,
    name: "sessionId",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Secure in production
      httpOnly: true, // Prevent client-side access
      maxAge: 1000 * 60 * 60, // 1 hour expiration
    },
  })(req, res, next);
};

export default sessionMiddleware;
