import { Pool } from "pg";

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const pool = new Pool({
  user: "plebsicle",        
  host: "localhost", 
  database: "microfin",     
  password: process.env.DATABASE_PASSWORD,
  port: 6432,              
  max: 128,                 
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 30000,
  query_timeout: 15000,
});

export default pool;
