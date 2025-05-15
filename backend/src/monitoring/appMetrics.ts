import promClient from 'prom-client';

// Initialize registry
const register = new promClient.Registry();

// Kafka metrics
const kafkaMessageCounter = new promClient.Counter({
  name: 'kafka_messages_total',
  help: 'Total Kafka messages processed',
  labelNames: ['topic', 'operation'],
  registers: [register]
});

// Database connection pool metrics
const dbConnectionPoolGauge = new promClient.Gauge({
  name: 'db_connection_pool',
  help: 'Database connection pool statistics',
  labelNames: ['state'], // 'active', 'idle', 'waiting'
  registers: [register]
});

// Session metrics
const activeSessionsGauge = new promClient.Gauge({
  name: 'active_sessions',
  help: 'Number of active user sessions',
  registers: [register]
});

// API error rates
const apiErrorCounter = new promClient.Counter({
  name: 'api_errors_total',
  help: 'Total API errors',
  labelNames: ['endpoint', 'error_type'],
  registers: [register]
});

// Success transaction counter
const transactionCounter = new promClient.Counter({
  name: 'transactions_total',
  help: 'Total successful transactions',
  labelNames: ['type'],
  registers: [register]
});

// Export individual metrics for use in application code
export {
  register,
  kafkaMessageCounter,
  dbConnectionPoolGauge,
  activeSessionsGauge,
  apiErrorCounter,
  transactionCounter
};

/**
 * Provide utilities for registering app-specific metrics with the main registry
 * @param mainRegistry The main Prometheus registry
 */
export const registerWithMainRegistry = (mainRegistry: promClient.Registry): void => {
  mainRegistry.registerMetric(kafkaMessageCounter);
  mainRegistry.registerMetric(dbConnectionPoolGauge);
  mainRegistry.registerMetric(activeSessionsGauge);
  mainRegistry.registerMetric(apiErrorCounter);
  mainRegistry.registerMetric(transactionCounter);
};

export default {
  registerWithMainRegistry,
  kafkaMessageCounter,
  dbConnectionPoolGauge,
  activeSessionsGauge,
  apiErrorCounter,
  transactionCounter
}; 