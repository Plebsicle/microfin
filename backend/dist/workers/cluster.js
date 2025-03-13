"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cluster_1 = __importDefault(require("node:cluster"));
const os_1 = __importDefault(require("os"));
require("ts-node/register");
const numWorkers = os_1.default.cpus().length;
if (node_cluster_1.default.isPrimary) {
    console.log(`Primary process ${process.pid} is running with ${numWorkers} workers`);
    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
        node_cluster_1.default.fork();
    }
    node_cluster_1.default.on("exit", (worker) => {
        console.log(`Worker ${worker.process.pid} died, restarting...`);
        node_cluster_1.default.fork();
    });
    node_cluster_1.default.on("online", (worker) => {
        console.log(`Worker ${worker.process.pid} is online`);
    });
}
else {
    console.log(`Worker ${process.pid} started`);
    Promise.resolve().then(() => __importStar(require("../index.js"))).then(() => {
        console.log(`Worker ${process.pid} is now handling requests`);
    })
        .catch((err) => {
        console.error(`Failed to load server module: ${err.message}`);
        process.exit(1);
    });
}
