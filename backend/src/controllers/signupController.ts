import { Request, Response } from "express";
import { validateSignupDetails } from "../utility/zodValidation";
import prisma from "../database/prisma/prismaInstance";
import { hashPassword } from "../utility/passwordHash";

async function signupController(req: Request, res: Response){
    const {name , email , password} = req.body;
    if (!name || !email || !password) {
        res.status(400).json({ message: "All fields (name, email, password) are required" });
        return;
    }
    const validationResult = validateSignupDetails(name , email,password);
    
    if(!validationResult) {res.status(400).json({message : "Invalid Input"}); return;}

    const userExist = await Promise.race([
        prisma.user.findUnique({ where: { email } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("DB Timeout")), 5000))
    ]);

    if(userExist) {res.status(400).json({message : "Email in Use"}); return;}
    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword
        }
    });

    (req.session as any).user = {id : newUser.id , details : {name , email} };
    console.log("Session before saving:", req.session);
    req.session.save((err) => {
        if (err) {
            console.error("❌ Session save error:", err);
            res.status(500).json({ message: "Session error" });
            return;
        }
        console.log("✅ Session saved:", req.session);
        res.status(200).json({ message: "User Created Successfully" });
        return ;
    });
}

export default signupController;