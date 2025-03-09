import prisma from '../database/prisma/prismaInstance';
import { getAccountFromCache} from '../config/redis/cache.service';

export const verifyWithdrawalEligibility = async (accountNumber: string, amount: number): Promise<{
  eligible: boolean;
  account?: any;
  message?: string;
}> => {
  const account = await getAccountFromCache(accountNumber);
  
  if (!account) {
    return { eligible: false, message: "Account not found" };
  }
  
  if (Number(account.balance) < amount) {
    return { eligible: false, message: "Insufficient balance" };
  }
  
  return { eligible: true, account };
};

export const verifyTransferEligibility = async (
  senderAccountNumber: string, 
  receiverAccountNumber: string, 
  amount: number
): Promise<{
  eligible: boolean;
  senderAccount?: any;
  receiverAccount?: any;
  message?: string;
}> => {
  const senderAccount = await getAccountFromCache(senderAccountNumber);
  if (!senderAccount) {
    return { eligible: false, message: "Sender account not found" };
  }
  
  const receiverAccount = await getAccountFromCache(receiverAccountNumber);
  if (!receiverAccount) {
    return { eligible: false, message: "Receiver account not found" };
  }
  
  if (Number(senderAccount.balance) < amount) {
    return { eligible: false, message: "Sender does not have enough balance" };
  }
  
  return { eligible: true, senderAccount, receiverAccount };
};

export const verifyDepositEligibility = async (accountNumber: string): Promise<{
  eligible: boolean;
  account?: any;
  message?: string;
}> => {
  const account = await getAccountFromCache(accountNumber);
  
  if (!account) {
    return { eligible: false, message: "Account not found" };
  }
  
  return { eligible: true, account };
};