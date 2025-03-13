import { Transaction } from '../config/kafka/transaction.model';
import pool from '../database/db';
import { updateAccountCache } from '../config/redis/cache.service';
import { updateTransactionStatus } from '../config/kafka/transaction.service';

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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE "Account" SET balance = balance - $1 WHERE accountNumber = $2',
      [data.amount, data.accountNumber]
    );

    await client.query(
      'INSERT INTO "Transaction" (id, type, amount, "senderAccountId", status) VALUES ($1, $2, $3, $4, $5)',
      [data.transactionId, 'WITHDRAWAL', data.amount, data.accountId, 'COMPLETED']
    );

    await client.query('COMMIT');
    console.log(data.amount, 'Withdrew Successfully');
    await updateAccountCache(data.accountNumber);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing withdrawal:', error);
    await updateTransactionStatus(data.transactionId, 'FAILED');
  } finally {
    client.release();
  }
}

async function processDeposit(data: Transaction & { type: 'DEPOSIT' }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE "Account" SET balance = balance + $1 WHERE accountNumber = $2',
      [data.amount, data.accountNumber]
    );

    await client.query(
      'INSERT INTO "Transaction" (id, type, amount, "receiverAccountId", status) VALUES ($1, $2, $3, $4, $5)',
      [data.transactionId, 'DEPOSIT', data.amount, data.accountId, 'COMPLETED']
    );

    await client.query('COMMIT');
    console.log(data.amount, 'Deposited Successfully');
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
      'INSERT INTO "Transaction" (id, type, amount, "senderAccountId", "receiverAccountId", status) VALUES ($1, $2, $3, $4, $5, $6)',
      [data.transactionId, 'TRANSFER', data.amount, data.senderAccountId, data.receiverAccountId, 'COMPLETED']
    );

    await client.query('COMMIT');
    console.log(data.amount, 'Transferred Successfully');
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
