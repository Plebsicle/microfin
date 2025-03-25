import { Transaction } from '../config/kafka/transaction.model';
import pool from '../database/db';
import { updateAccountCachePipelineUpdated } from '../config/redis/cache.service';
import { updateTransactionStatus } from '../config/kafka/transaction.service';
import fs from "fs";
import path from "path";

const logFilePath = path.join(__dirname, "../logs/signup_timing.log");

// Configuration for batching
const BATCH_SIZE = 100; // Number of transactions to process in a batch
const BATCH_INTERVAL_MS = 5; // Maximum time to wait before processing a batch

// Batch storage for different transaction types
const depositBatch: (Transaction & { type: 'DEPOSIT' })[] = [];
const withdrawalBatch: (Transaction & { type: 'WITHDRAWAL' })[] = [];
const transferBatch: (Transaction & { type: 'TRANSFER' })[] = [];

// Batch processing timers
let depositTimer: NodeJS.Timeout | null = null;
let withdrawalTimer: NodeJS.Timeout | null = null;
let transferTimer: NodeJS.Timeout | null = null;

function logToFile(message: string) {
    fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
}

// The improved Redis caching function


export const processTransaction = async (transaction: Transaction): Promise<void> => {
  switch (transaction.type) {
    case 'WITHDRAWAL':
      addToWithdrawalBatch(transaction as Transaction & { type: 'WITHDRAWAL' });
      break;
    case 'DEPOSIT':
      addToDepositBatch(transaction as Transaction & { type: 'DEPOSIT' });
      break;
    case 'TRANSFER':
      addToTransferBatch(transaction as Transaction & { type: 'TRANSFER' });
      break;
    default:
      console.error(`Unknown transaction type: ${(transaction as any).type}`);
  }
};

// Add transaction to withdrawal batch and schedule processing if needed
function addToWithdrawalBatch(transaction: Transaction & { type: 'WITHDRAWAL' }) {
  withdrawalBatch.push(transaction);
  
  if (withdrawalBatch.length >= BATCH_SIZE) {
    // Process immediately if batch is full
    if (withdrawalTimer) {
      clearTimeout(withdrawalTimer);
      withdrawalTimer = null;
    }
    processWithdrawalBatch();
  } else if (!withdrawalTimer) {
    // Start timer for batch processing
    withdrawalTimer = setTimeout(processWithdrawalBatch, BATCH_INTERVAL_MS);
  }
}

// Add transaction to deposit batch and schedule processing if needed
function addToDepositBatch(transaction: Transaction & { type: 'DEPOSIT' }) {
  depositBatch.push(transaction);
  
  if (depositBatch.length >= BATCH_SIZE) {
    // Process immediately if batch is full
    if (depositTimer) {
      clearTimeout(depositTimer);
      depositTimer = null;
    }
    processDepositBatch();
  } else if (!depositTimer) {
    // Start timer for batch processing
    depositTimer = setTimeout(processDepositBatch, BATCH_INTERVAL_MS);
  }
}

// Add transaction to transfer batch and schedule processing if needed
function addToTransferBatch(transaction: Transaction & { type: 'TRANSFER' }) {
  transferBatch.push(transaction);
  
  if (transferBatch.length >= BATCH_SIZE) {
    // Process immediately if batch is full
    if (transferTimer) {
      clearTimeout(transferTimer);
      transferTimer = null;
    }
    processTransferBatch();
  } else if (!transferTimer) {
    // Start timer for batch processing
    transferTimer = setTimeout(processTransferBatch, BATCH_INTERVAL_MS);
  }
}

// Process all withdrawal transactions in the current batch
async function processWithdrawalBatch() {
  if (withdrawalBatch.length === 0) return;
  
  const batchToProcess = [...withdrawalBatch];
  withdrawalBatch.length = 0; // Clear the batch
  withdrawalTimer = null;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Group transactions by account for efficient updates
    const accountUpdates = new Map<string, number>();
    const transactionRecords = [];
    
    for (const transaction of batchToProcess) {
      const currentAmount = accountUpdates.get(transaction.accountNumber) || 0;
      accountUpdates.set(transaction.accountNumber, currentAmount + transaction.amount);
      
      transactionRecords.push({
        id: transaction.transactionId,
        type: 'WITHDRAWAL',
        amount: transaction.amount,
        senderAccountId: transaction.accountId,
        status: 'COMPLETED'
      });
    }
    
    // Update all affected accounts in a single query using CASE expression
    if (accountUpdates.size > 0) {
      const cases = [];
      const params = [];
      let paramIndex = 1;
      
      for (const [accountNumber, totalAmount] of accountUpdates.entries()) {
        cases.push(`WHEN accountNumber = $${paramIndex++} THEN balance - $${paramIndex++}`);
        params.push(accountNumber, totalAmount);
      }
      
      const query = `
        UPDATE "Account" 
        SET balance = CASE ${cases.join(' ')} ELSE balance END
        WHERE accountNumber IN (${Array(accountUpdates.size).fill(0).map((_, i) => `$${i * 2 + 1}`).join(', ')})
        RETURNING accountNumber, balance
      `;
      
      const { rows } = await client.query(query, params);
      
      // Create a map of updated balances for cache updating
      const updatedBalances = new Map<string, number>();
      rows.forEach(row => {
        updatedBalances.set(row.accountnumber, row.balance);
      });
      accountUpdates.clear(); // Clear the map to reuse for final balances
      
      // Transfer updated balances to account updates map
      for (const [accountNumber, balance] of updatedBalances.entries()) {
        accountUpdates.set(accountNumber, balance);
      }
    }
    
    // Insert all transaction records in bulk
    const insertValues = transactionRecords.map((record, index) => 
      `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5})`
    ).join(', ');
    
    const insertParams = transactionRecords.flatMap(record => 
      [record.id, record.type, record.amount, record.senderAccountId, record.status]
    );
    
    await client.query(
      `INSERT INTO "Transaction" (id, type, amount, "senderaccountid", status) VALUES ${insertValues}`,
      insertParams
    );
    
    await client.query('COMMIT');
    console.log(`Processed ${batchToProcess.length} withdrawals successfully`);
    
    // Update cache for all affected accounts with the new balances
    await updateAccountCachePipelineUpdated(accountUpdates);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing withdrawal batch:', error);
    
    // Handle failed transactions individually
    for (const transaction of batchToProcess) {
      await updateTransactionStatus(transaction.transactionId, 'FAILED');
    }
  } finally {
    client.release();
  }
}

// Process all deposit transactions in the current batch
async function processDepositBatch() {
  if (depositBatch.length === 0) return;
  
  const batchToProcess = [...depositBatch];
  depositBatch.length = 0; // Clear the batch
  depositTimer = null;
  
  const depositDatabaseTime = Date.now();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Group transactions by account for efficient updates
    const accountUpdates = new Map<string, number>();
    const transactionRecords = [];
    
    for (const transaction of batchToProcess) {
      const currentAmount = accountUpdates.get(transaction.accountNumber) || 0;
      accountUpdates.set(transaction.accountNumber, currentAmount + transaction.amount);
      
      transactionRecords.push({
        id: transaction.transactionId,
        type: 'DEPOSIT',
        amount: transaction.amount,
        receiverAccountId: transaction.accountId,
        status: 'COMPLETED'
      });
    }
    
    // Update all affected accounts in a single query using CASE expression
    if (accountUpdates.size > 0) {
      const cases = [];
      const params = [];
      let paramIndex = 1;
      
      for (const [accountNumber, totalAmount] of accountUpdates.entries()) {
        cases.push(`WHEN accountNumber = $${paramIndex++} THEN balance + $${paramIndex++}`);
        params.push(accountNumber, totalAmount);
      }
      
      const query = `
        UPDATE "Account" 
        SET balance = CASE ${cases.join(' ')} ELSE balance END
        WHERE accountNumber IN (${Array(accountUpdates.size).fill(0).map((_, i) => `$${i * 2 + 1}`).join(', ')})
        RETURNING accountNumber, balance
      `;
      
      const { rows } = await client.query(query, params);
      
      // Create a map of updated balances for cache updating
      const updatedBalances = new Map<string, number>();
      rows.forEach(row => {
        updatedBalances.set(row.accountnumber, row.balance);
      });
      accountUpdates.clear(); // Clear the map to reuse for final balances
      
      // Transfer updated balances to account updates map
      for (const [accountNumber, balance] of updatedBalances.entries()) {
        accountUpdates.set(accountNumber, balance);
      }
    }
    
    // Insert all transaction records in bulk
    const insertValues = transactionRecords.map((record, index) => 
      `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5})`
    ).join(', ');
    
    const insertParams = transactionRecords.flatMap(record => 
      [record.id, record.type, record.amount, record.receiverAccountId, record.status]
    );
    
    await client.query(
      `INSERT INTO "Transaction" (id, type, amount, "receiveraccountid", status) VALUES ${insertValues}`,
      insertParams
    );
    
    await client.query('COMMIT');
    logToFile(`Batch Deposit Database time (${batchToProcess.length} transactions): ${Date.now() - depositDatabaseTime}ms`);
    console.log(`Processed ${batchToProcess.length} deposits successfully`);
    
    // Update cache for all affected accounts with the new balances
    await updateAccountCachePipelineUpdated(accountUpdates);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing deposit batch:', error);
    
    // Handle failed transactions individually
    for (const transaction of batchToProcess) {
      await updateTransactionStatus(transaction.transactionId, 'FAILED');
    }
  } finally {
    client.release();
  }
}

// Process all transfer transactions in the current batch
async function processTransferBatch() {
  if (transferBatch.length === 0) return;
  
  const batchToProcess = [...transferBatch];
  transferBatch.length = 0; // Clear the batch
  transferTimer = null;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Group transactions by account for efficient updates
    const senderAccountUpdates = new Map<string, number>();
    const receiverAccountUpdates = new Map<string, number>();
    const transactionRecords = [];
    
    for (const transaction of batchToProcess) {
      // Update sender account totals
      const currentSenderAmount = senderAccountUpdates.get(transaction.senderAccountNumber) || 0;
      senderAccountUpdates.set(transaction.senderAccountNumber, currentSenderAmount + transaction.amount);
      
      // Update receiver account totals
      const currentReceiverAmount = receiverAccountUpdates.get(transaction.receiverAccountNumber) || 0;
      receiverAccountUpdates.set(transaction.receiverAccountNumber, currentReceiverAmount + transaction.amount);
      
      transactionRecords.push({
        id: transaction.transactionId,
        type: 'TRANSFER',
        amount: transaction.amount,
        senderAccountId: transaction.senderAccountId,
        receiverAccountId: transaction.receiverAccountId,
        status: 'COMPLETED'
      });
    }
    
    const allUpdatedAccounts = new Map<string, number>();
    
    // Update all sender accounts in a single query using CASE expression
    if (senderAccountUpdates.size > 0) {
      const cases = [];
      const params = [];
      let paramIndex = 1;
      
      for (const [accountNumber, totalAmount] of senderAccountUpdates.entries()) {
        cases.push(`WHEN accountNumber = $${paramIndex++} THEN balance - $${paramIndex++}`);
        params.push(accountNumber, totalAmount);
      }
      
      const query = `
        UPDATE "Account" 
        SET balance = CASE ${cases.join(' ')} ELSE balance END
        WHERE accountNumber IN (${Array(senderAccountUpdates.size).fill(0).map((_, i) => `$${i * 2 + 1}`).join(', ')})
        RETURNING accountNumber, balance
      `;
      
      const { rows } = await client.query(query, params);
      
      // Store updated balances
      rows.forEach(row => {
        allUpdatedAccounts.set(row.accountnumber, row.balance);
      });
    }
    
    // Update all receiver accounts in a single query using CASE expression
    if (receiverAccountUpdates.size > 0) {
      const cases = [];
      const params = [];
      let paramIndex = 1;
      
      for (const [accountNumber, totalAmount] of receiverAccountUpdates.entries()) {
        cases.push(`WHEN accountNumber = $${paramIndex++} THEN balance + $${paramIndex++}`);
        params.push(accountNumber, totalAmount);
      }
      
      const query = `
        UPDATE "Account" 
        SET balance = CASE ${cases.join(' ')} ELSE balance END
        WHERE accountNumber IN (${Array(receiverAccountUpdates.size).fill(0).map((_, i) => `$${i * 2 + 1}`).join(', ')})
        RETURNING accountNumber, balance
      `;
      
      const { rows } = await client.query(query, params);
      
      // Store updated balances
      rows.forEach(row => {
        allUpdatedAccounts.set(row.accountnumber, row.balance);
      });
    }
    
    // Insert all transaction records in bulk
    const insertValues = transactionRecords.map((record, index) => 
      `($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6})`
    ).join(', ');
    
    const insertParams = transactionRecords.flatMap(record => 
      [record.id, record.type, record.amount, record.senderAccountId, record.receiverAccountId, record.status]
    );
    
    await client.query(
      `INSERT INTO "Transaction" (id, type, amount, "senderaccountid", "receiveraccountid", status) VALUES ${insertValues}`,
      insertParams
    );
    
    await client.query('COMMIT');
    console.log(`Processed ${batchToProcess.length} transfers successfully`);
    
    // Update cache for all affected accounts with their new balances
    await updateAccountCachePipelineUpdated(allUpdatedAccounts);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing transfer batch:', error);
    
    // Handle failed transactions individually
    for (const transaction of batchToProcess) {
      await updateTransactionStatus(transaction.transactionId, 'FAILED');
    }
  } finally {
    client.release();
  }
}

// For graceful shutdown - process any remaining transactions in batches
export async function processRemainingTransactions(): Promise<void> {
  if (depositTimer) {
    clearTimeout(depositTimer);
    depositTimer = null;
  }
  if (withdrawalTimer) {
    clearTimeout(withdrawalTimer);
    withdrawalTimer = null;
  }
  if (transferTimer) {
    clearTimeout(transferTimer);
    transferTimer = null;
  }
  
  const promises = [];
  if (depositBatch.length > 0) promises.push(processDepositBatch());
  if (withdrawalBatch.length > 0) promises.push(processWithdrawalBatch());
  if (transferBatch.length > 0) promises.push(processTransferBatch());
  
  await Promise.all(promises);
}