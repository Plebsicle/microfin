import { Request,Response } from "express";

export async function tempFunction(req : Request , res : Response){
    if(!req.session.user){ res.status(400).json({message : "User Not Logged In"}); return;};
    res.json({message : "HII"}); 
    return;
}