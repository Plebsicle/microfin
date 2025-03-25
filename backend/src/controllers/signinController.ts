import pool from "../database/db";
import { Request, Response } from "express";
import { validateSigninDetails } from "../utility/zodValidation";
import { comparePassword } from "../utility/passwordHash";
import fs from "fs";
import path from "path";

const logFilePath = path.join(__dirname, "../logs/signup_timing.log");

function logToFile(message: string) {
    fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
}

// Batch processing setup
interface UserRequest {
    email: string;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timestamp: number;
}

const userRequestQueue: UserRequest[] = [];
const BATCH_SIZE = 100; // Maximum number of requests per batch
const BATCH_INTERVAL_MS = 5; // Minimum time between batch processing
const REQUEST_TIMEOUT_MS = 5000; // 5 second timeout for requests
let processingBatch = false;
let batchTimer: NodeJS.Timeout | null = null;

async function processBatch() {
    if (processingBatch || userRequestQueue.length === 0) return;
    
    processingBatch = true;
    if (batchTimer) {
        clearTimeout(batchTimer);
        batchTimer = null;
    }
    
    // Take up to BATCH_SIZE requests from the queue
    const batchSize = Math.min(userRequestQueue.length, BATCH_SIZE);
    const batch = userRequestQueue.splice(0, batchSize);
    
    // Check for timed-out requests
    const now = Date.now();
    const validRequests = batch.filter(req => (now - req.timestamp) < REQUEST_TIMEOUT_MS);
    const timedOutRequests = batch.filter(req => (now - req.timestamp) >= REQUEST_TIMEOUT_MS);
    
    // Reject timed out requests
    timedOutRequests.forEach(req => req.reject(new Error("Request timed out")));
    
    if (validRequests.length === 0) {
        processingBatch = false;
        scheduleBatchProcessing();
        return;
    }
    
    try {
        const emails = validRequests.map(req => req.email);
        const signinDatabaseTime = Date.now();
        const query = `SELECT * FROM "User" WHERE email = ANY($1)`;
        const { rows } = await pool.query(query, [emails]);
        logToFile(`Signin Database times (batch of ${validRequests.length}): ${Date.now() - signinDatabaseTime}ms`);
        
        const userMap = new Map(rows.map(user => [user.email, user]));
        
        // Resolve all requests with their corresponding users
        validRequests.forEach(req => req.resolve(userMap.get(req.email) || null));
    } catch (error) {
        console.error("❌ Batch database query error:", error);
        // Reject all requests with the error
        validRequests.forEach(req => req.reject(error));
    } finally {
        processingBatch = false;
        scheduleBatchProcessing();
    }
}

function scheduleBatchProcessing() {
    if (userRequestQueue.length > 0 && !processingBatch && !batchTimer) {
        batchTimer = setTimeout(processBatch, BATCH_INTERVAL_MS);
    }
}

async function batchFetchUser(email: string) {
    return new Promise((resolve, reject) => {
        const request: UserRequest = {
            email,
            resolve,
            reject,
            timestamp: Date.now()
        };
        
        userRequestQueue.push(request);
        
        // Process immediately if we've hit batch size
        if (userRequestQueue.length >= BATCH_SIZE) {
            scheduleBatchProcessing();
        } else if (!batchTimer && !processingBatch) {
            // Otherwise schedule for later processing
            scheduleBatchProcessing();
        }
    });
}

async function signinController(req: Request, res: Response) {
    const { email, password } = req.body;
    const validationResult = validateSigninDetails(email, password);
    if (!validationResult) {
        res.status(400).json({ message: "Invalid Input" });
        return;
    }
    
    try {
        const userExist = await batchFetchUser(email) as any;
        if (!userExist) {
            res.status(400).json({ message: "Signup First" });
            return;
        }
        
        const passwordValidation = await comparePassword(password, userExist.password);
        if (!passwordValidation) {
            res.status(401).json({ message: "Invalid Password" });
            return;
        }
        
        (req.session as any).user = { id: userExist.id, details: { name: userExist.name, email } };
        const response = JSON.stringify({ message: "User Signed In Successfully" });
        res.setHeader('Content-Length', Buffer.byteLength(response));
        res.status(200).send(response);
    } catch (error) {
        console.error("❌ Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// For graceful shutdown
export function cleanupBatchProcessing() {
    if (batchTimer) {
        clearTimeout(batchTimer);
        batchTimer = null;
    }
    
    // Process any remaining requests
    if (userRequestQueue.length > 0) {
        processBatch();
    }
}

export default signinController;