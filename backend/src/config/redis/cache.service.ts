import { redisCluster } from './redis';
import  pool  from '../../database/db';

export const getAccountFromCache = async (accountNumber : any) => {
    const cachedData = await redisCluster.get(`account:${accountNumber}`);
    if (cachedData) return JSON.parse(cachedData);

    const query = 'SELECT accountNumber,balance FROM "Account" WHERE accountNumber = $1';
    const { rows } = await pool.query(query, [accountNumber]);
    const account = rows[0];
    if (account) {
        await redisCluster.set(`account:${accountNumber}`, JSON.stringify(account), 'EX', 300);
    }
    return account;
};

export const updateAccountCache = async (accountNumber: string, newBalance?: number) => {
    const accountKey = `account:${accountNumber}`;
    const cachedAccount = await redisCluster.get(accountKey);
    if (cachedAccount) {
        const accountData = JSON.parse(cachedAccount);
        accountData.balance = newBalance; 
        await redisCluster.set(accountKey, JSON.stringify(accountData), 'EX', 300);
        return;
    }
    const query = 'SELECT accountNumber,balance FROM "Account" WHERE accountNumber = $1';
    const { rows } = await pool.query(query, [accountNumber]);
    const updatedAccount = rows[0];
    if (updatedAccount) {
        await redisCluster.set(accountKey, JSON.stringify(updatedAccount), 'EX', 300);
    }
};