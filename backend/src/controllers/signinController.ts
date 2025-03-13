import pool from "../database/db";
import { Request, Response } from "express";
import { validateSigninDetails } from "../utility/zodValidation";
import { comparePassword } from "../utility/passwordHash";

async function signinController(req: Request, res: Response) {
    const { email, password } = req.body;
    const validationResult = validateSigninDetails(email, password);
    if (!validationResult) {
        res.status(400).json({ message: "Invalid Input" });
        return;
    }
    try {
        const userExistQuery = "SELECT * FROM \"User\" WHERE email = $1";
        const { rows: users } = await pool.query(userExistQuery, [email]);
        const userExist = users[0];

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
        console.log("Session before saving:", req.session);
        req.session.save((err) => {
            if (err) {
                console.error("❌ Session save error:", err);
                res.status(500).json({ message: "Session error" });
                return;
            }
            console.log("✅ Session saved:", req.session);
            res.status(200).json({ message: "User Signed In Successfully" });
        });
    } catch (error) {
        console.error("❌ Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default signinController;