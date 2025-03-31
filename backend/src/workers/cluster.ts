import cluster from "node:cluster";
import os from "os";
import "ts-node/register";

const numWorkers = os.cpus().length; 

if (cluster.isPrimary) {
    console.log(`Primary process ${process.pid} is running with ${numWorkers} workers`);

    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker) => {
        console.log(`Worker ${worker.process.pid} died, restarting...`);
        cluster.fork();
    });

    cluster.on("online", (worker) => {
        console.log(`Worker ${worker.process.pid} is online`);
    });
} else {
    console.log(`Worker ${process.pid} started`);
    import("../index.js")
        .then(() => {
            console.log(`Worker ${process.pid} is now handling requests`);
        })
        .catch((err) => {
            console.error(`Failed to load server module: ${err.message}`);
            process.exit(1);
        });
}
