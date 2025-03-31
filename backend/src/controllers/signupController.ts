import { Request, Response } from "express";
import pool from "../database/db"; // Import pg pool
import { validateSignupDetails } from "../utility/zodValidation";
import { hashPassword } from "../utility/passwordHash";
// import fs from "fs";
// import path from "path";

// const logFilePath = path.join(__dirname, "../logs/signup_timing.log");

// function logToFile(message: string) {
//     fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
// }

async function signupController(req: Request, res: Response) {
    const startTime = Date.now();
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        //logToFile("Request missing required fields.");
        res.status(400).json({ message: "All fields are required" });
        return;
    }

    // Validate Input
    //const validationStart = Date.now();
    const validationResult = validateSignupDetails(name, email, password);
    //logToFile(`🔍 Validation Time: ${Date.now() - validationStart}ms`);

    if (!validationResult) {
        //logToFile("Invalid input provided.");
        res.status(400).json({ message: "Invalid Input" });
        return;
    }
    let client;
    try {
        // Hash Password
        const hashingStart = Date.now();
        const hashedPassword = await hashPassword(password);
        //logToFile(`Hashing Password Time: ${Date.now() - hashingStart}ms`);

        // Insert User into DB
        const databaseInsertTime = Date.now();
        client = await pool.connect();
        await client.query("BEGIN");
        const result = await client.query(
            `INSERT INTO "User" (name, email, password) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (email) DO NOTHING 
             RETURNING id`,
            [name, email, hashedPassword]
        );
        await client.query("COMMIT");
        client.release();
        //logToFile(`📝 Create in Database time ${Date.now() - databaseInsertTime}ms`);
        if (result.rowCount === 0) {
            //logToFile("Email already in use.");
            res.status(400).json({ message: "Email in Use" });
            return;
        }

        //Set session asynchronously
        (req.session as any).user = { id: result.rows[0].id , details: { name, email } };
        // await new Promise(resolve => req.session.save(resolve));
        // console.log(req.session.id);
        //logToFile(`Total Signup Time: ${Date.now() - startTime}ms`);
        const response = JSON.stringify({ message: "User Created Successfully" });
        res.setHeader('Content-Length', Buffer.byteLength(response));
        res.status(200).send(response);
    } catch (error: any) {
        //logToFile(`Database Error: ${error.message}`);
        console.error("Database Error:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
}

export default signupController;
