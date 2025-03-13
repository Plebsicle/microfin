import { Request, Response } from "express";
import { generateAccountNumber } from '../utility/accountGeneration';
import  pool  from "../database/db";
import { updateAccountCache } from "../config/redis/cache.service";

async function accountController(req: Request, res: Response) {
    if (!req.session.user) {
        res.status(401).json({ message: "User not logged in" });
        return;
    }

    const newAccountNumber = generateAccountNumber();

    try {
        const query = `INSERT INTO "Account" (accountNumber, userId) VALUES ($1, $2) RETURNING accountNumber, balance`;
        const values = [newAccountNumber, req.session.user.id];

        const result = await pool.query(query, values);
        const newAccount = result.rows[0];

        res.status(200).json({
            message: "New Account Created Successfully",
            accountNumber: newAccount.accountNumber,
            balance: newAccount.balance
        });

        updateAccountCache(newAccount.accountNumber);
    } catch (error) {
        console.error("Error creating new account:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export default accountController;