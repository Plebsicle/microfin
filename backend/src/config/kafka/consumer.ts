import { Consumer } from 'kafkajs';
import { kafka, CONSUMER_GROUP_ID, FINANCIAL_TOPIC } from './kafka';
import { processTransaction } from '../../handlers/transaction.handler'

let consumer: Consumer;

export const initializeConsumer = async (): Promise<Consumer> => {
  consumer = kafka.consumer({
    groupId: CONSUMER_GROUP_ID,
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    maxBytesPerPartition: 1048576, // 1MB
    readUncommitted: false // Only read committed transactions
  });
  
  await consumer.connect();
  await consumer.subscribe({ 
    topic: FINANCIAL_TOPIC, 
    fromBeginning: false 
  });
  
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const transactionData = JSON.parse(message.value!.toString());
        console.log(`Processing transaction: ${transactionData.transactionId}`);
        
        // Process the transaction
        await processTransaction(transactionData);
      } catch (error) {
        console.error('Error processing Kafka message:', error);
        // Could implement dead letter queue here
      }
    },
  });
  
  console.log('Kafka consumer started');
  
  return consumer;
};

export const getConsumer = (): Consumer => {
  if (!consumer) {
    throw new Error('Consumer not initialized');
  }
  return consumer;
};

export const disconnectConsumer = async (): Promise<void> => {
  if (consumer) {
    await consumer.disconnect();
    console.log('Kafka consumer disconnected');
  }
};