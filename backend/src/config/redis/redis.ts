import Redis, { Cluster } from "ioredis";
import genericPool from "generic-pool";

// Create a Redis Cluster connection pool
const redisClusterPool = genericPool.createPool(
  {
    create: async () => {
      return new Redis.Cluster(
        [
          { host: "localhost", port: 6379 }, // Master 1
          { host: "localhost", port: 6380 }, // Master 2 
          { host: "localhost", port: 6381 }, // Master 3
        ],
        {
          scaleReads: "master",
          redisOptions: {
            connectTimeout: 10000,
          },
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
            if (times > 5) return null; // Fail after 5 retries
            return Math.min(100 + times * 200, 2000);
          }
        }
      );
    },
    destroy: async (client) => {
      await client.quit();
    },
    validate: async (client) => {
      try {
        await client.ping();
        return true;
      } catch (err) {
        return false;
      }
    },
  },
  {
    min: 100, // Minimum number of connections in the pool
    max: 250, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle connections after 30s
  }
);

export async function getRedisCluster() {
  return await redisClusterPool.acquire();
}

export async function releaseRedisCluster(client : any) {
  await redisClusterPool.release(client);
}

// ✅ Debug: Test Redis Write & Read
(async () => {
  const redisCluster = await getRedisCluster();
  try {
    await redisCluster.set("test_key", "test_value", "EX", 60);
    const value = await redisCluster.get("test_key");
    console.log("🔹 Test Key Value:", value);
  } catch (error) {
    console.error("❌ Redis Write Error:", error);
  } finally {
    await releaseRedisCluster(redisCluster);
  }
})();
