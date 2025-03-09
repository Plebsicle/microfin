import { Kafka, KafkaConfig } from 'kafkajs';

const kafkaConfig: KafkaConfig = {
  clientId: 'financial-service',
  brokers: ['localhost:19094', 'localhost:19096', 'localhost:19098']
};

export const kafka = new Kafka(kafkaConfig);
export const FINANCIAL_TOPIC = 'financial-transactions';
export const CONSUMER_GROUP_ID = 'financial-transaction-group';
