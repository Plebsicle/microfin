import pool from "../database/db";
import { Request, Response } from "express";
import { validateSigninDetails } from "../utility/zodValidation";
import { comparePassword } from "../utility/passwordHash";
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


async function signinController(req: Request, res: Response) {
    const { email, password } = req.body;
    const validationResult = validateSigninDetails(email, password);
    if (!validationResult) {
        res.status(400).json({ message: "Invalid Input" });
        return;
    }
    try {
        //console.log(`Signin API hit`);
        const userExistQuery = "SELECT * FROM \"User\" WHERE email = $1";
        const signinDatabaseTime = Date.now();
        const { rows: users } = await pool.query(userExistQuery, [email]);
        //logToFile(`Signin Database times : ${Date.now() - signinDatabaseTime}ms`);
        const userExist = users[0];
        if (!userExist) {
            res.status(400).json({ message: "Signup First" });
            console.log("Hi Not Allowed");
            return;
        }

        const passwordValidation = await comparePassword(password, userExist.password);
        if (!passwordValidation) {
            res.status(401).json({ message: "Invalid Password" });
            console.log("Hi Not Allowed");
            return;
        }
        const saveSession = Date.now();
        (req.session as any).user = { id: userExist.id, details: { name: userExist.name, email } };
        //logToFile2(`Save Redis Session Time : ${Date.now() - saveSession}ms`);
        const response = JSON.stringify({ message: "User Signed In  Successfully" });
        res.setHeader('Content-Length', Buffer.byteLength(response));
        res.status(200).send(response);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default signinController;