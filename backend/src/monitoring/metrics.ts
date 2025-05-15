import promClient from 'prom-client';
import responseTime from 'response-time';
import { Express, Request, Response, NextFunction } from 'express';
import appMetrics from './appMetrics';

// Initialize the Prometheus registry
const register = new promClient.Registry();

// Add default metrics (memory, CPU, etc.)
promClient.collectDefaultMetrics({ register });

// HTTP request counter
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests count',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// HTTP request duration histogram
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Memory usage gauge
const memoryUsageGauge = new promClient.Gauge({
  name: 'node_process_memory_usage_bytes',
  help: 'Memory usage of the Node.js process in bytes',
  registers: [register],
  collect() {
    this.set(process.memoryUsage().heapUsed);
  }
});

// Request size summary
const requestSizeSummary = new promClient.Summary({
  name: 'http_request_size_bytes',
  help: 'HTTP request size in bytes',
  labelNames: ['method', 'route'],
  registers: [register]
});

/**
 * Middleware to monitor request metrics
 */
const monitorRequest = responseTime((req: Request, res: Response, time: number) => {
  const route = req.originalUrl || req.url;
  const method = req.method;
  const statusCode = res.statusCode.toString();
  
  // Record request count
  httpRequestCounter.inc({ method, route, status_code: statusCode });
  
  // Record request duration
  httpRequestDuration.observe({ method, route, status_code: statusCode }, time / 1000);
  
  // Record request size
  const contentLength = req.headers['content-length'] ? 
    parseInt(req.headers['content-length'] as string, 10) : 0;
  requestSizeSummary.observe({ method, route }, contentLength);
});

/**
 * Register metrics middleware with Express app
 */
export const setupMetrics = (app: Express) => {
  // Apply monitoring middleware
  app.use(monitorRequest);
  
  // Register application-specific metrics
  appMetrics.registerWithMainRegistry(register);
  
  // Expose metrics endpoint
  app.get('/metrics', async (_req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
  
  console.log('Metrics monitoring initialized');
};

export { register, httpRequestCounter, httpRequestDuration, requestSizeSummary, memoryUsageGauge };
export default setupMetrics; 