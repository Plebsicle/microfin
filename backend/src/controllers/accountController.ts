import { Request, Response } from "express";
import { generateAccountNumber } from '../utility/accountGeneration';
import pool from "../database/db";
import { updateAccountCachePipelineUpdated } from "../config/redis/cache.service";
import fs from "fs";
import path from "path";

const logFilePath = path.join(__dirname, "../logs/signup_timing.log");

function logToFile(message: string) {
    fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
}

// Batch configuration
const ACCOUNT_BATCH_SIZE = 100;
const ACCOUNT_BATCH_INTERVAL_MS = 5;

// Queue for account creation requests
interface AccountCreationRequest {
    userId: string;
    accountNumber: string;
    responseCallback: (account: any) => void;
    errorCallback: (error: any) => void;
}

let accountCreationQueue: AccountCreationRequest[] = [];
let accountCreationTimer: NodeJS.Timeout | null = null;

async function accountController(req: Request, res: Response) {
    if (!req.session.user || req.session.user === null) {
        res.status(401).json({ message: "User not logged in" });
        return;
    }

    const newAccountNumber = generateAccountNumber();

    const accountRequest: AccountCreationRequest = {
        userId: req.session.user.id,
        accountNumber: newAccountNumber,
        responseCallback: (account) => {
            res.status(200).json({
                message: "New Account Created Successfully",
                accountNumber: account.accountNumber,
                balance : 0
            });
        },
        errorCallback: (error) => {
            console.error("Error creating new account:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    };
    console.log("Sending accountRequest to Batch Creation Function");
    addToAccountCreationBatch(accountRequest);
}

function addToAccountCreationBatch(request: AccountCreationRequest) {
    accountCreationQueue.push(request);
    console.log("Batch Creation Function Reached");
    if (accountCreationQueue.length >= ACCOUNT_BATCH_SIZE) {
        // Process immediately if batch is full
        if (accountCreationTimer) {
            clearTimeout(accountCreationTimer);
            accountCreationTimer = null;
        }
        console.log("Calling Process Account Creation Batch ");
        processAccountCreationBatch();
    } else if (!accountCreationTimer) {
        // Start timer for batch processing
        accountCreationTimer = setTimeout(processAccountCreationBatch, ACCOUNT_BATCH_INTERVAL_MS);
    }
}

async function processAccountCreationBatch(){
    if (accountCreationQueue.length === 0) return;
    console.log(" Process Account Creation Batch Reached ");
    const batchToProcess = [...accountCreationQueue];
    accountCreationQueue.length = 0; // Clear the queue
    accountCreationTimer = null;
    
    const databaseBatchTime = Date.now();
    const client = await pool.connect();
    
    try {
        //console.log("Executing Batch Query");
        await client.query('BEGIN');
        // Create all accounts in a single query using PostgreSQL's unnest function
        const userIds = batchToProcess.map(req => req.userId);
        const accountNumbers = batchToProcess.map(req => req.accountNumber);
        // console.log("Inserting accounts:");
        // console.log("User IDs:", userIds);
        // console.log("Account Numbers:", accountNumbers);
        
        const query = `
            INSERT INTO "Account" (accountNumber, userId)
            SELECT unnest($1::text[]), unnest($2::text[])
            RETURNING accountNumber
        `;

        const result = await client.query(query, [accountNumbers, userIds]);
        await client.query('COMMIT');
        // console.log("Batch Query Succesful");
        // console.log("Insert query result:", result);
        // console.log("Rows returned:", result.rows);

        logToFile(`Batch Account creation time (${batchToProcess.length} accounts): ${Date.now() - databaseBatchTime}ms`);
        
        // Map results back to requests and send responses
        const accountsByNumber = new Map();
        const redisParameterMap = new Map<string,number>;
        for (const row of result.rows) {
            accountsByNumber.set(row.accountnumber, {
                accountNumber: row.accountnumber,
                balance: 0,
            });
            redisParameterMap.set(row.accountnumber, 0);
        }
        // **Use pipelined cache updates**
        console.log(redisParameterMap);
        try{
            console.log("Updating Cache");
            await updateAccountCachePipelineUpdated(redisParameterMap);
            console.log("Cache updated");
        }
        catch(e){
            console.log("Error in Redis Cache Update :",e);
        }
        // console.log("Sending Responses Back");
        // console.log(batchToProcess);
        for (const request of batchToProcess) {
            try {
                const account = accountsByNumber.get(request.accountNumber);
                console.log(`Processing request for account: ${request.accountNumber}, Found: ${account}`);

                if (account) {
                    request.responseCallback(account);
                } else {
                    console.error(`Account creation failed for ${request.accountNumber}`);
                    request.errorCallback(new Error(`Account creation failed for ${request.accountNumber}`));
                }
            } catch (error) {
                console.error(`Error in response loop for ${request.accountNumber}:`, error);
                request.errorCallback(error);
            }
        }
        //console.log("Responses sent Successfully");
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing account creation batch:', error);
        console.log("Transaction rolled back!");
        // Send error responses to all clients
        for (const request of batchToProcess) {
            request.errorCallback(error);
        }
    } finally {
        client.release();
    }
}

// For graceful shutdown
export async function processRemainingAccountRequests(): Promise<void> {
    if (accountCreationTimer) {
        clearTimeout(accountCreationTimer);
        accountCreationTimer = null;
    }
    
    if (accountCreationQueue.length > 0) {
        await processAccountCreationBatch();
    }
}

export default accountController;
