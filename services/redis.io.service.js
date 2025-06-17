import Redis from "ioredis";

const redisClient = new Redis(
  process.env.REDIS_URI 
);

redisClient.on("connect", () => {
  console.log("Connected to Redis Cloud");
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

export default redisClient;
