"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../database/db")); // Import pg pool
const zodValidation_1 = require("../utility/zodValidation");
const passwordHash_1 = require("../utility/passwordHash");
// const logFilePath = path.join(__dirname, "../logs/signup_timing.log");
// function logToFile(message: string) {
//     fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
// }
function signupController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        //const startTime = Date.now();
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            //logToFile("❌ Request missing required fields.");
            res.status(400).json({ message: "All fields are required" });
            return;
        }
        // Validate Input
        // const validationStart = Date.now();
        const validationResult = (0, zodValidation_1.validateSignupDetails)(name, email, password);
        //logToFile(`🔍 Validation Time: ${Date.now() - validationStart}ms`);
        if (!validationResult) {
            //logToFile("❌ Invalid input provided.");
            res.status(400).json({ message: "Invalid Input" });
            return;
        }
        let client;
        try {
            // Hash Password
            //const hashingStart = Date.now();
            const hashedPassword = yield (0, passwordHash_1.hashPassword)(password);
            //logToFile(`🔑 Hashing Password Time: ${Date.now() - hashingStart}ms`);
            // Insert User into DB
            //const createUserStart = Date.now();
            client = yield db_1.default.connect();
            yield client.query("BEGIN");
            const result = yield client.query(`INSERT INTO "User" (name, email, password) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (email) DO NOTHING 
             RETURNING id`, [name, email, hashedPassword]);
            yield client.query("COMMIT");
            client.release();
            //logToFile(`📝 Create User in DB Time: ${Date.now() - createUserStart}ms`);
            if (result.rowCount === 0) {
                //logToFile("⚠️ Email already in use.");
                res.status(400).json({ message: "Email in Use" });
                return;
            }
            // Set session asynchronously
            req.session.user = { id: result.rows[0].id, details: { name, email } };
            yield new Promise(resolve => req.session.save(resolve));
            //logToFile(`✅ Total Signup Time: ${Date.now() - startTime}ms`);
            const response = JSON.stringify({ message: "User Created Successfully" });
            res.setHeader('Content-Length', Buffer.byteLength(response));
            res.status(200).send(response);
        }
        catch (error) {
            //logToFile(`❌ Database Error: ${error.message}`);
            console.error("❌ Database Error:", error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
exports.default = signupController;
