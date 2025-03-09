import cluster from "node:cluster";
import http from "node:http";
import os from "node:os";
import net from "node:net";

const numWorkers = 15;
const PORT = 8000;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Create a server and listen
  const server = net.createServer();
  server.listen(PORT, () => {
    console.log(`Primary server listening on port ${PORT}`);
  });

  // Store worker stats
  const workerStats: { [key: number]: { pid: number | null; requestCount: number } } = {};

  // Fork workers after the server is listening
  server.on("listening", () => {
    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
      const worker = cluster.fork();
      workerStats[worker.id] = {
        pid: null,
        requestCount: 0,
      };

      // Set up message handling from workers
      worker.on("message", (msg) => {
        if (msg.type === "WORKER_PID") {
          workerStats[worker.id].pid = msg.pid;
          console.log(`Worker ${worker.id} registered with PID ${msg.pid}`);
        } else if (msg.type === "REQUEST_HANDLED") {
          workerStats[worker.id].requestCount++;
          console.log(`Worker ${msg.pid} handled request #${workerStats[worker.id].requestCount}`);
        }
      });

      // Send the server handle to the worker
      worker.send({ type: "SERVER", serverHandle: server.address() });
    }

    // Print stats every 5 seconds
    setInterval(() => {
      console.log("\n--- WORKER STATS ---");
      Object.keys(workerStats).forEach((id) => {
        console.log(`Worker ${id} (PID: ${workerStats[parseInt(id)].pid}): ${workerStats[parseInt(id)].requestCount} requests`);
      });
      console.log("-------------------\n");
    }, 5000);

    // Close the primary server - it's just used to get the server handle
    server.close();
  });

  // Handle worker exit
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    const newWorker = cluster.fork();
    workerStats[newWorker.id] = {
      pid: null,
      requestCount: 0,
    };
  });
} else {
  // Worker process
  console.log(`Worker ${process.pid} started`);

  // Send PID to master
  if (process.send) {
    process.send({ type: "WORKER_PID", pid: process.pid });
  }

  // Listen for server handle from master
  process.on("message", (msg: { type: string; pid?: number; serverHandle?: net.AddressInfo }) => {
    if (msg.type === "SERVER") {
      // Create a server
      const server = http.createServer((req, res) => {
        // Notify master about handling a request
        if (process.send) {
          process.send({ type: "REQUEST_HANDLED", pid: process.pid });
        }

        res.writeHead(200);
        res.end(`Hello from worker ${process.pid}\n`);
      });

      // Start listening using the handle sent from the primary
      server.listen(msg.serverHandle, () => {
        console.log(`Worker ${process.pid} is now listening on shared handle`);
      });
    }
  });
}