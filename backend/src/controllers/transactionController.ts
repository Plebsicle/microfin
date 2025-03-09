import { Request, Response } from 'express';
import { amountValidation, amountTransferValidation } from '../utility/zodValidation';
import { publishTransaction } from '../config/kafka/transaction.service';
import { generateTransactionId } from '../utility/accountGeneration';
import { 
  verifyWithdrawalEligibility, 
  verifyTransferEligibility, 
  verifyDepositEligibility 
} from '../services/account.service';

export async function withdrawController(req: Request, res: Response) {
    if (!req.session.user) {
        res.status(401).json({ message: "User not logged in" });
        return ;
    }

    const { amount, accountNumber } = req.body;
    const parsedAmount = Number(amount);
    const parsedAccountNumber = String(accountNumber);

    if (parsedAmount <= 0) {
         res.status(400).json({ message: "Invalid Withdrawal Amount" });
         return;
    }

    const validationResult = await amountValidation(parsedAmount, parsedAccountNumber);
    if (!validationResult) {
         res.status(400).json({ message: "Invalid Input Amount or Account Number" });
         return;
    }

    try {
        const { eligible, account, message } = await verifyWithdrawalEligibility(
          parsedAccountNumber, 
          parsedAmount
        );
        
        if (!eligible) {
             res.status(400).json({ message });
             return;
        }

        // Publish withdrawal transaction to Kafka
        const transactionId = generateTransactionId();
        const published = await publishTransaction({
            transactionId,
            type: 'WITHDRAWAL',
            amount: parsedAmount,
            accountNumber: parsedAccountNumber,
            accountId: account.id,
            userId: req.session.user.id
        }, parsedAccountNumber); // Using account number as the key for partitioning

        if (published) {
             res.status(202).json({ message: "Withdrawal request accepted" });
             return;
        } else {
             res.status(500).json({ message: "Failed to process withdrawal" });
             return;
        }

    } catch (error) {
        console.error("Withdrawal Error:", error);
         res.status(500).json({ message: "Internal Server Error" });
         return;
    }
}

export async function transferController(req: Request, res: Response) {
    if (!req.session.user) {
         res.status(401).json({ message: "User not logged in" });
         return;
    }

    const { amount, senderAccountNumber, receiverAccountNumber } = req.body;
    const parsedAmount = Number(amount);

    if (parsedAmount <= 0) {
         res.status(400).json({ message: "Transfer amount must be greater than zero" });
         return;
    }

    const validationResult = await amountTransferValidation(
      parsedAmount, 
      senderAccountNumber, 
      receiverAccountNumber
    );
    
    if (!validationResult) {
         res.status(400).json({ message: "Invalid Transfer Details" });
         return;
    }

    try {
        const { 
          eligible, 
          senderAccount, 
          receiverAccount, 
          message 
        } = await verifyTransferEligibility(
          senderAccountNumber, 
          receiverAccountNumber, 
          parsedAmount
        );
        
        if (!eligible) {
             res.status(400).json({ message });
             return;
        }

        // Publish transfer transaction to Kafka
        const transactionId = generateTransactionId();
        const published = await publishTransaction({
            transactionId,
            type: 'TRANSFER',
            amount: parsedAmount,
            senderAccountNumber,
            receiverAccountNumber,
            senderAccountId: senderAccount.id,
            receiverAccountId: receiverAccount.id,
            userId: req.session.user.id
        }, senderAccountNumber); // Using sender account number as the key for partitioning

        if (published) {
             res.status(202).json({ message: "Transfer request accepted" });
             return;
        } else {
             res.status(500).json({ message: "Failed to process transfer" });
             return;
        }

    } catch (error) {
        console.error("Transfer Error:", error);
         res.status(500).json({ message: "Internal Server Error" });
         return;
    }
}

export async function depositController(req: Request, res: Response) {
    if (!req.session.user) {
         res.status(401).json({ message: "User not logged in" });
         return;
    }

    const { amount, accountNumber } = req.body;
    const parsedAmount = Number(amount);
    const parsedAccountNumber = String(accountNumber);

    if (parsedAmount <= 0) {
         res.status(400).json({ message: "Deposit amount must be greater than zero" });
         return;
    }

    const validationResult = await amountValidation(parsedAmount, parsedAccountNumber);
    if (!validationResult) {
         res.status(400).json({ message: "Invalid Input Amount" });
         return;
    }

    try {
        const { eligible, account, message } = await verifyDepositEligibility(parsedAccountNumber);
        
        if (!eligible) {
             res.status(400).json({ message });
             return;
        }

        // Publish deposit transaction to Kafka
        const transactionId = generateTransactionId();

        const published = await publishTransaction({
            transactionId,
            type: 'DEPOSIT',
            amount: parsedAmount,
            accountNumber: parsedAccountNumber,
            accountId: account.id,
            userId: req.session.user.id
        }, parsedAccountNumber); // Using account number as the key for partitioning

        if (published) {
             res.status(202).json({ message: "Deposit request accepted" });
             return;
        } else {
             res.status(500).json({ message: "Failed to process deposit" });
             return;
        }

    } catch (error) {
        console.error("Deposit Error:", error);
         res.status(500).json({ message: "Internal Server Error" });
         return;
    }
}