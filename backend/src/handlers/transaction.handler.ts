import { Transaction } from '../config/kafka/transaction.model';
import prisma from '../database/prisma/prismaInstance';
import { updateAccountCache } from '../config/redis/cache.service';
import { updateTransactionStatus } from '../config/kafka/transaction.service'

export const processTransaction = async (transaction: Transaction): Promise<void> => {
  switch (transaction.type) {
    case 'WITHDRAWAL':
      await processWithdrawal(transaction);
      break;
    case 'DEPOSIT':
      await processDeposit(transaction);
      break;
    case 'TRANSFER':
      await processTransfer(transaction);
      break;
    default:
      console.error(`Unknown transaction type: ${(transaction as any).type}`);
  }
};

async function processWithdrawal(data: Transaction & { type: 'WITHDRAWAL' }) {
  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.account.update({
        where: { accountNumber: data.accountNumber },
        data: { balance: { decrement: data.amount } }
      });

      await prisma.transaction.create({
        data: {
          id: data.transactionId,
          type: 'WITHDRAWAL',
          amount: data.amount,
          senderAccountId: data.accountId,
          status: 'COMPLETED',
        }
      });
    });
    console.log(data.amount , "Withdrew Succesfully");
    await updateAccountCache(data.accountNumber);
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    await updateTransactionStatus(data.transactionId, 'FAILED');
  }
}

async function processDeposit(data: Transaction & { type: 'DEPOSIT' }) {
  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.account.update({
        where: { accountNumber: data.accountNumber },
        data: { balance: { increment: data.amount } }
      });

      await prisma.transaction.create({
        data: {
          id: data.transactionId,
          type: 'DEPOSIT',
          amount: data.amount,
          receiverAccountId: data.accountId,
          status: 'COMPLETED',
        }
      });
    });
    console.log(data.amount , "Deposited Succesfully");
    await updateAccountCache(data.accountNumber);
  } catch (error) {
    console.error('Error processing deposit:', error);
    await updateTransactionStatus(data.transactionId, 'FAILED');
  }
}

async function processTransfer(data: Transaction & { type: 'TRANSFER' }) {
  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.account.update({
        where: { accountNumber: data.senderAccountNumber },
        data: { balance: { decrement: data.amount } }
      });

      await prisma.account.update({
        where: { accountNumber: data.receiverAccountNumber },
        data: { balance: { increment: data.amount } }
      });

      await prisma.transaction.create({
        data: {
          id: data.transactionId,
          type: 'TRANSFER',
          amount: data.amount,
          receiverAccountId: data.receiverAccountId,
          senderAccountId: data.senderAccountId,
          status: 'COMPLETED',
        }
      });
    });
    console.log(data.amount , "Transffered Succesfully");
    await updateAccountCache(data.senderAccountNumber);
    await updateAccountCache(data.receiverAccountNumber);
  } catch (error) {
    console.error('Error processing transfer:', error);
    await updateTransactionStatus(data.transactionId, 'FAILED');
  }
}