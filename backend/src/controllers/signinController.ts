import prisma from "../database/prisma/prismaInstance";
import { Request,Response } from "express";
import { validateSigninDetails } from "../utility/zodValidation";
import { comparePassword } from "../utility/passwordHash";


async function signinController(req : Request , res : Response ){
    const {email,password} = req.body;
    const validationResult = validateSigninDetails(email,password);
    if(!validationResult){
        res.status(400).json({message : "Invalid Input"});
        return;
    }
    const userExist = await prisma.user.findUnique({
        where : {email}
    });
    if(!userExist){
        res.status(400).json({message : "Signup First"});
        return;
    }
    const passwordValidation = await comparePassword(password,userExist.password);
    if(!passwordValidation){
        res.status(401).json({message : "Invalid Password"});
        return;
    }

    (req.session as any).user = {id : userExist.id , details : { name: userExist.name , email} };
    console.log("Session before saving:", req.session);
    req.session.save((err) => {
        if (err) {
            console.error("❌ Session save error:", err);
            res.status(500).json({ message: "Session error" });
            return;
        }
        console.log("✅ Session saved:", req.session);
        res.status(200).json({ message: "User Signed In Successfully" });
        return ;
    });
}

export default signinController;