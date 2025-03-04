import { Request, Response } from "express";
import generateAccountNumber from '../utility/accountGeneration'
import prisma from "../database/prisma/prismaInstance";


async function accountController(req : Request , res : Response){
    if(!req.session.user){
        res.status(401).json({message : "user not logged in "});
        return;
    }
    const newAccountNumber = generateAccountNumber();
    const newAccount = await prisma.account.create({
        data : {
            accountNumber : newAccountNumber,
            userId : req.session.user.id
        }
    });
    res.status(200).json({message : "New Account Created Succesfully",
        accountNumber : newAccount.accountNumber , balance : newAccount.balance
    });
    return;
}

export default accountController