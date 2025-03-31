// import { Request, Response } from 'express';
// import prisma from '../database/prisma/prismaInstance';
// import { amountValidation, amountTransferValidation } from '../utility/zodValidation';
// import { redisCluster } from '../config/redis/redis';

// async function getAccountFromCache(accountNumber: string) {
//     const cachedData = await redisCluster.get(`account:${accountNumber}`);
//     if (cachedData) return JSON.parse(cachedData);

//     const account = await prisma.account.findUnique({
//         where: { accountNumber }
//     });

//     if (account) {
//         await redisCluster.set(`account:${accountNumber}`, JSON.stringify(account), 'EX', 300); // Cache for 5 minutes
//     }
//     return account;
// }

// async function updateAccountCache(accountNumber: string) {
//     const updatedAccount = await prisma.account.findUnique({
//         where: { accountNumber }
//     });
//     if (updatedAccount) {
//         await redisCluster.set(`account:${accountNumber}`, JSON.stringify(updatedAccount), 'EX', 300);
//     }
// }

// async function withdrawController(req: Request, res: Response) {
//     if (!req.session.user) {
//         res.status(401).json({ message: "User not logged in" });
//         return;
//     }

//     const { amount, accountNumber } = req.body;
//     const parsedAmount = Number(amount);
//     const parsedAccountNumber = String(accountNumber);

//     if (parsedAmount <= 0) {
//         res.status(400).json({ message: "Invalid Withdrawal Amount" });
//         return;
//     }

//     const validationResult = await amountValidation(parsedAmount, parsedAccountNumber);
//     if (!validationResult) {
//         res.status(400).json({ message: "Invalid Input Amount or Account Number" });
//         return;
//     }

//     try {
//         const account = await getAccountFromCache(parsedAccountNumber);

//         if (!account) {
//             res.status(404).json({ message: "Account not found" });
//             return;
//         }

//         if (Number(account.balance) < parsedAmount) {
//             res.status(400).json({ message: "Insufficient balance" });
//             return;
//         }

//         await prisma.$transaction(async (prisma) => {
//             await prisma.account.update({
//                 where: { accountNumber: parsedAccountNumber },
//                 data: { balance: { decrement: parsedAmount } }
//             });

//             await prisma.transaction.create({
//                 data: {
//                     type: 'WITHDRAWAL',
//                     amount: parsedAmount,
//                     senderAccountId: account.id
//                 }
//             });
//         });

//         await updateAccountCache(parsedAccountNumber);

//         res.status(200).json({ message: "Amount Withdrawn Successfully" });

//     } catch (error) {
//         console.error("Withdrawal Error:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// }

// async function transferController(req: Request, res: Response) {
//     if (!req.session.user) {
//         res.status(401).json({ message: "User not logged in" });
//         return;
//     }

//     const { amount, senderAccountNumber, receiverAccountNumber } = req.body;
//     const parsedAmount = Number(amount);

//     if (parsedAmount <= 0) {
//         res.status(400).json({ message: "Transfer amount must be greater than zero" });
//         return;
//     }

//     const validationResult = await amountTransferValidation(parsedAmount, senderAccountNumber, receiverAccountNumber);
//     if (!validationResult) {
//         res.status(400).json({ message: "Invalid Transfer Details" });
//         return;
//     }

//     try {
//         const senderAccount = await getAccountFromCache(senderAccountNumber);
//         const receiverAccount = await getAccountFromCache(receiverAccountNumber);

//         if (!senderAccount) {
//             res.status(404).json({ message: "Sender account not found" });
//             return;
//         }

//         if (!receiverAccount) {
//             res.status(404).json({ message: "Receiver account not found" });
//             return;
//         }

//         if (Number(senderAccount.balance) < parsedAmount) {
//             res.status(400).json({ message: "Sender does not have enough balance" });
//             return;
//         }

//         await prisma.$transaction(async (prisma) => {
//             await prisma.account.update({
//                 where: { accountNumber: senderAccountNumber },
//                 data: { balance: { decrement: parsedAmount } }
//             });

//             await prisma.account.update({
//                 where: { accountNumber: receiverAccountNumber },
//                 data: { balance: { increment: parsedAmount } }
//             });

//             await prisma.transaction.create({
//                 data: {
//                     type: 'TRANSFER',
//                     amount: parsedAmount,
//                     receiverAccountId: receiverAccount.id,
//                     senderAccountId: senderAccount.id
//                 }
//             });
//         });

//         await updateAccountCache(senderAccountNumber);
//         await updateAccountCache(receiverAccountNumber);

//         res.status(200).json({ message: "Amount Transferred Successfully" });

//     } catch (error) {
//         console.error("Transfer Error:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// }

// // Deposit Controller
// async function depositController(req: Request, res: Response) {
//     if (!req.session.user) {
//         res.status(401).json({ message: "User not logged in" });
//         return;
//     }

//     const { amount, accountNumber } = req.body;
//     const parsedAmount = Number(amount);
//     const parsedAccountNumber = String(accountNumber);

//     if (parsedAmount <= 0) {
//         res.status(400).json({ message: "Deposit amount must be greater than zero" });
//         return;
//     }

//     const validationResult = await amountValidation(parsedAmount, parsedAccountNumber);
//     if (!validationResult) {
//         res.status(400).json({ message: "Invalid Input Amount" });
//         return;
//     }

//     try {
//         const account = await getAccountFromCache(parsedAccountNumber);

//         if (!account) {
//             res.status(404).json({ message: "Account not found" });
//             return;
//         }

//         await prisma.$transaction(async (prisma) => {
//             await prisma.account.update({
//                 where: { accountNumber: parsedAccountNumber },
//                 data: { balance: { increment: parsedAmount } }
//             });

//             await prisma.transaction.create({
//                 data: {
//                     type: 'DEPOSIT',
//                     amount: parsedAmount,
//                     receiverAccountId: account.id
//                 }
//             });
//         });

//         await updateAccountCache(parsedAccountNumber);

//         res.status(200).json({ message: "Amount Deposited Successfully" });

//     } catch (error) {
//         console.error("Deposit Error:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// }

// export { depositController, transferController, withdrawController };
