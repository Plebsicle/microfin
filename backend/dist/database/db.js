"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    user: "plebsicle", // Change this to your local PostgreSQL username
    host: "localhost",
    database: "microfin", // Change to your actual database name
    password: "2001", // Change this to your local DB password
    port: 5432, // Default PostgreSQL port
    max: 500, // Max connections in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30s
    connectionTimeoutMillis: 5000, // Timeout if connection takes >2s
});
exports.default = pool;
