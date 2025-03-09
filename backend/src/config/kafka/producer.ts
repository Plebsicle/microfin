import { Producer } from 'kafkajs';
import { kafka } from './kafka';

let producer: Producer;

export const initializeProducer = async (): Promise<Producer> => {
  producer = kafka.producer({
    idempotent: true, // only publish a message once
    maxInFlightRequests: 1,
    retry: { retries: 5 }
  });
  
  await producer.connect();
  console.log('Kafka producer connected');
  
  return producer;
};

export const getProducer = (): Producer => {
  if (!producer) {
    throw new Error('Producer not initialized');
  }
  return producer;
};

export const disconnectProducer = async (): Promise<void> => {
  if (producer) {
    await producer.disconnect();
    console.log('Kafka producer disconnected');
  }
};