import { getProducer } from './producer';
import { FINANCIAL_TOPIC } from './kafka';
import { Transaction } from './transaction.model';
import  pool  from '../../database/db';

export const publishTransaction = async (data: Transaction, key: string): Promise<boolean> => {
  try {
    const producer = getProducer();
    await producer.send({
      topic: FINANCIAL_TOPIC,
      messages: [
        { 
          key, 
          value: JSON.stringify({
            ...data,
          }) 
        }
      ],
    });
    return true;
  } catch (error) {
    console.error('Error publishing to Kafka:', error);
    return false;
  }
};

export const updateTransactionStatus = async (transactionId: string, status: string): Promise<void> => {
  try {
    const query = 'UPDATE "Transaction" SET status = $1 WHERE id = $2';
    await pool.query(query, [status, transactionId]);
  } catch (error) {
    console.error('Error updating transaction status:', error);
  }
};
