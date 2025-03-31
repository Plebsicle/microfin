import cors, { CorsOptions } from "cors";

const whitelist: Set<string> = new Set(["http://localhost:5173"]);

const corsOptions: CorsOptions = {
    optionsSuccessStatus: 200, 
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || whitelist.has(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not Allowed By CORS"));
        }
    },
    credentials: true,
};

export default cors(corsOptions);
