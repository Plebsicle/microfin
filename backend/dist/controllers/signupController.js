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
const zodValidation_1 = require("../utility/zodValidation");
const prismaInstance_1 = __importDefault(require("../database/prisma/prismaInstance"));
const passwordHash_1 = require("../utility/passwordHash");
function signupController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ message: "All fields (name, email, password) are required" });
            return;
        }
        const validationResult = (0, zodValidation_1.validateSignupDetails)(name, email, password);
        if (!validationResult) {
            res.status(400).json({ message: "Invalid Input" });
            return;
        }
        const userExist = yield Promise.race([
            prismaInstance_1.default.user.findUnique({ where: { email } }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("DB Timeout")), 5000))
        ]);
        if (userExist) {
            res.status(400).json({ message: "Email in Use" });
            return;
        }
        const hashedPassword = yield (0, passwordHash_1.hashPassword)(password);
        const newUser = yield prismaInstance_1.default.user.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        });
        req.session.user = { id: newUser.id, details: { name, email } };
        console.log("Session before saving:", req.session);
        req.session.save((err) => {
            if (err) {
                console.error("❌ Session save error:", err);
                res.status(500).json({ message: "Session error" });
                return;
            }
            console.log("✅ Session saved:", req.session);
            res.status(200).json({ message: "User Created Successfully" });
            return;
        });
    });
}
exports.default = signupController;
