import { Request, Response } from "express";
import { generateAccountNumber } from '../utility/accountGeneration';
import  {pool}  from "../database/db";
import { updateAccountCache } from "../config/redis/cache.service";
// import fs from "fs";
// import path from "path";

// const logFilePath = path.join(__dirname, "../logs/databaseLogs.log");
// const logFilePath2 = path.join(__dirname, "../logs/redisLogs.log");

// function logToFile(message: string) {
//     fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
// }

// function logToFile2(message: string) {
//     fs.appendFileSync(logFilePath2, `${new Date().toISOString()} - ${message}\n`);
// }



async function accountController(req: Request, res: Response) {
    if (!req.session.user || req.session.user === null) {
        res.status(401).json({ message: "User not logged in" });
        return;
    }

    const newAccountNumber = generateAccountNumber();
    try {
        //console.log(`Account Generation API hit`);
        
        const query = `INSERT INTO "Account" (accountNumber, userId) VALUES ($1, $2) RETURNING accountNumber, balance`;
        const values = [newAccountNumber, req.session.user.id];
    
        let result;
        try {
            result = await pool.query(query, values);
        } catch (dbError) {
            console.error("Database Error:", dbError);
            res.status(500).json({ message: "Database Error" });
            return ;
        }
    
        const newAccount = result.rows[0];
    
        try {
            await updateAccountCache(newAccount.accountNumber);
        } catch (redisError) {
            console.error("Redis Error:", redisError);
        }
        res.status(200).json({
            message: "New Account Created Successfully",
            accountNumber: newAccountNumber,
            balance: newAccount.balance
        }); 
    } catch (error) {
        console.error("Unexpected Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
        return; 
    }
    
}

export default accountController;