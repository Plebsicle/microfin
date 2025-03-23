import { Pool } from "pg";

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const pool = new Pool({
  user: "plebsicle",        // Change to your Cloud SQL PostgreSQL username
  host: "localhost", // Replace with your Cloud SQL instance's public IP
  database: "microfin",     // Your actual database name
  password: process.env.DATABASE_PASSWORD,// Your Cloud SQL PostgreSQL password
  port: 6432,              // Default PostgreSQL port for Google Cloud SQL
  max: 64,                 // Match to your worker count exactly
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 30000,
  query_timeout: 15000,
});

export default pool;
