import { Transaction } from '../config/kafka/transaction.model';
import pool from '../database/db';
import { updateAccountCache } from '../config/redis/cache.service';
import { updateTransactionStatus } from '../config/kafka/transaction.service';
// import fs from "fs";
// import path from "path";

// const logFilePath = path.join(__dirname, "../logs/databaseLogs.log");
// const logFilePath2 = path.join(__dirname, "../logs/redisLogs.log");

// function logToFile(message: string) {
//     fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
// }

// function logToFile2(message: string) {
//     fs.appendFileSync(logFilePath2, `${new Date().toISOString()} - ${message}\n`);
// }


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
  //const databaseStartTime = Date.now();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE "Account" SET balance = balance - $1 WHERE accountNumber = $2',
      [data.amount, data.accountNumber]
    );

    await client.query(
      'INSERT INTO "Transaction" (id, type, amount, "senderaccountid", status) VALUES ($1, $2, $3, $4, $5)',
      [data.transactionId, 'WITHDRAWAL', data.amount, data.accountId, 'COMPLETED']
    );
    await client.query('COMMIT');
    //logToFile(`Withdrawal Database times : ${Date.now() - databaseStartTime}ms`);
    //console.log(data.amount, 'Withdrew Successfully');
    //const saveRedisWithdrawal = Date.now();
    await updateAccountCache(data.accountNumber);
    //logToFile2(`Withdrawal Redis Save Time : ${Date.now() - saveRedisWithdrawal}ms`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing withdrawal:', error);
    await updateTransactionStatus(data.transactionId, 'FAILED');
  } finally {
    client.release();
  }
}

async function processDeposit(data: Transaction & { type: 'DEPOSIT' }) {
  const DepositDatabaseTime = Date.now();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'EXPLAIN ANALYSE UPDATE "Account" SET balance = balance + $1 WHERE accountNumber = $2',
      [data.amount, data.accountNumber]
    );

    await client.query(
      'EXPLAIN ANALYZE INSERT INTO "Transaction" (id, type, amount, "receiveraccountid", status) VALUES ($1, $2, $3, $4, $5)',
      [data.transactionId, 'DEPOSIT', data.amount, data.accountId, 'COMPLETED']
    );

    await client.query('COMMIT');
    //logToFile(`Deposit Database times : ${Date.now() - DepositDatabaseTime}ms`);

    //const saveRedisDeposit = Date.now();
    await updateAccountCache(data.accountNumber);
    //logToFile2(`Deposit Redis Save Time : ${Date.now() - saveRedisDeposit}ms`);
    await updateAccountCache(data.accountNumber);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing deposit:', error);
    await updateTransactionStatus(data.transactionId, 'FAILED');
  } finally {
    client.release();
  }
}

async function processTransfer(data: Transaction & { type: 'TRANSFER' }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE "Account" SET balance = balance - $1 WHERE accountNumber = $2',
      [data.amount, data.senderAccountNumber]
    );

    await client.query(
      'UPDATE "Account" SET balance = balance + $1 WHERE accountNumber = $2',
      [data.amount, data.receiverAccountNumber]
    );

    await client.query(
      'INSERT INTO "Transaction" (id, type, amount, "senderaccountid", "receiveraccountid", status) VALUES ($1, $2, $3, $4, $5, $6)',
      [data.transactionId, 'TRANSFER', data.amount, data.senderAccountId, data.receiverAccountId, 'COMPLETED']
    );

    await client.query('COMMIT');
    //console.log(data.amount, 'Transferred Successfully');
    await updateAccountCache(data.senderAccountNumber);
    await updateAccountCache(data.receiverAccountNumber);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing transfer:', error);
    await updateTransactionStatus(data.transactionId, 'FAILED');
  } finally {
    client.release();
  }
}
