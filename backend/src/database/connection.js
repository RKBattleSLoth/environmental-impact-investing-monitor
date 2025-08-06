const { Pool } = require('pg');
const redis = require('redis');
const logger = require('../utils/logger');

let pool = null;
let redisClient = null;

const connectDB = async () => {
  try {
    // PostgreSQL connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test the connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    logger.info('PostgreSQL connected successfully');
    logger.info(`Database time: ${result.rows[0].now}`);

    // Redis connection
    redisClient = redis.createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    await redisClient.connect();

    return { pool, redisClient };
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

const getDB = () => {
  if (!pool) {
    throw new Error('Database not connected');
  }
  return pool;
};

const getRedis = () => {
  if (!redisClient) {
    throw new Error('Redis not connected');
  }
  return redisClient;
};

const closeConnections = async () => {
  try {
    if (pool) {
      await pool.end();
      logger.info('PostgreSQL connection closed');
    }
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing connections:', error);
  }
};

module.exports = {
  connectDB,
  getDB,
  getRedis,
  closeConnections
};