import { redisCluster } from './redis'
import prisma from '../../database/prisma/prismaInstance';

export const getAccountFromCache = async (accountNumber: string) => {
    const cachedData = await redisCluster.get(`account:${accountNumber}`);
    if (cachedData) return JSON.parse(cachedData);

    const account = await prisma.account.findUnique({
        where: { accountNumber }
    });

    if (account) {
        await redisCluster.set(`account:${accountNumber}`, JSON.stringify(account), 'EX', 300); // Cache for 5 minutes
    }
    return account;
};

export const updateAccountCache = async (accountNumber: string) => {
    const updatedAccount = await prisma.account.findUnique({
        where: { accountNumber }
    });
    if (updatedAccount) {
        await redisCluster.set(`account:${accountNumber}`, JSON.stringify(updatedAccount), 'EX', 300);
    }
};