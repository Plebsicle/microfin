import cluster from "node:cluster";
import path from "path";
import "ts-node/register"; // Ensure TypeScript files can be executed

const numWorkers = 15 // Use the number of available CPU cores

if (cluster.isPrimary) {
    console.log(`Primary process ${process.pid} is running`);

    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}, spawning a new one...`);
        cluster.fork();
    });

    cluster.on("online", (worker) => {
        console.log(`Worker ${worker.process.pid} is online`);
    });
} else {
    console.log(`Worker ${process.pid} started`);

    const serverPath = path.join(__dirname, "../index.js"); // Adjust path if necessary
    console.log(`Attempting to load server from: ${serverPath}`);

    import(serverPath)
        .then((serverModule) => {
            console.log(`Server module loaded successfully by worker ${process.pid}`);
        })
        .catch((err) => {
            console.error(`Failed to load server module: ${err.message}`);
            process.exit(1);
        });
}