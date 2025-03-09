import { getProducer } from './producer';
import { FINANCIAL_TOPIC } from './kafka';
import { Transaction } from './transaction.model';
import prisma from '../../database/prisma/prismaInstance';
import { TransactionStatus } from '@prisma/client';


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


export const updateTransactionStatus = async (transactionId: string, status: TransactionStatus): Promise<void> => {
  try {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status }
    });
  } catch (error) {
    console.error('Error updating transaction status:', error);
  }
};