import { redisCluster } from './redis';
import  pool  from '../../database/db';

export const getAccountFromCache = async (accountNumber : any) => {
    const cachedData = await redisCluster.get(`account:${accountNumber}`);
    if (cachedData) return JSON.parse(cachedData);

    const query = 'SELECT * FROM "Account" WHERE accountNumber = $1';
    const { rows } = await pool.query(query, [accountNumber]);
    const account = rows[0];

    if (account) {
        await redisCluster.set(`account:${accountNumber}`, JSON.stringify(account), 'EX', 300); // Cache for 5 minutes
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

    const query = 'SELECT balance FROM "Account" WHERE accountNumber = $1';
    const { rows } = await pool.query(query, [accountNumber]);
    const updatedAccount = rows[0];

    if (updatedAccount) {
        await redisCluster.set(accountKey, JSON.stringify(updatedAccount), 'EX', 300);
    }
};


export const updateAccountCachePipeline = async (accountNumbers: string[], newBalance?: number) => {
    if (accountNumbers.length === 0) return;

    const pipeline = redisCluster.pipeline();
    
    for (const accountNumber of accountNumbers) {
        const accountKey = `account:${accountNumber}`;
        pipeline.get(accountKey); // Get existing cache
    }

    const results = await pipeline.exec(); // Execute all GET commands in one call
    const accountDataMap = new Map<string, any>();

    if (results) { // result = [error , response]
        results.forEach((result, index) => {
            const accountNumber = accountNumbers[index];
            if (result[1]) {
                const accountData = JSON.parse(result[1].toString());
                if (newBalance !== undefined) {
                    accountData.balance = newBalance;
                }
                accountDataMap.set(accountNumber, accountData);
            }
        });
    }

    if(accountDataMap.size > 0) {
        const setPipeline = redisCluster.pipeline();
        accountDataMap.forEach((data, accountNumber) => {
            setPipeline.set(`account:${accountNumber}`, JSON.stringify(data), 'EX', 300);
        });
        await setPipeline.exec(); // Batch update all cached accounts
}
};

export const updateAccountCachePipelineUpdated = async (accountUpdates: Map<string, number>) => {
    if (accountUpdates.size === 0) return;
    console.log(accountUpdates);
    const pipeline = redisCluster.pipeline();
    accountUpdates.forEach((balance, accountnumber) => {
        //console.log("Account Number early" , accountnumber);
        const accountKey = `account:${accountnumber}`;
        pipeline.get(accountKey);
    });
    let results;
    try {
        results = await pipeline.exec();
    } catch (e){
        console.error("Error executing Redis pipeline:", e);
    }
    
    const accountDataMap = new Map<string, any>();
    const missingAccounts: string[] = [];
    const accountNumberArray: string[] = Array.from(accountUpdates.keys());
    console.log("AccountNumber array is : " , accountNumberArray);
    if (results) { // result = [error, response]
        results.forEach((result, index) => {
            const accountNumber = accountNumberArray[index];
            // console.log("Result in For Loop : " , result);
            // console.log("Account NUmber inside for Loop:",accountNumber);
            if (result[1]) {
                const accountData = JSON.parse(result[1].toString());
                const newBalance = accountUpdates.get(accountNumber);
                if (newBalance !== undefined) {
                    accountData.balance = newBalance;
                }
                accountDataMap.set(accountNumber, accountData);
            }
            else {
                missingAccounts.push(accountNumber);
            }
        });
    }

    if (missingAccounts.length > 0) {
        const client = await pool.connect();
        try {
            const query = `SELECT accountNumber, balance FROM "Account" WHERE accountNumber = ANY($1)`;
            const { rows } = await client.query(query, [missingAccounts]);
            rows.forEach((row) => {
                accountDataMap.set(row.accountnumber, row);
            });
        }
        catch (e) {
            console.log("Error Fetching missing accounts from DB", e);
        }
        finally {
            client.release();
        }
    }

    if (accountDataMap.size>0){
        const setPipeline = redisCluster.pipeline();
        accountDataMap.forEach((data, accountNumber) => {
            setPipeline.set(`account:${accountNumber}`, JSON.stringify(data), 'EX', 300);
        });
        try {
            await setPipeline.exec();
        } catch (e) {
            console.error("Error executing Redis pipeline:", e);
        }
    }
};