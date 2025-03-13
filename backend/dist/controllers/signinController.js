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
const db_1 = __importDefault(require("../database/db"));
const zodValidation_1 = require("../utility/zodValidation");
const passwordHash_1 = require("../utility/passwordHash");
function signinController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password } = req.body;
        const validationResult = (0, zodValidation_1.validateSigninDetails)(email, password);
        if (!validationResult) {
            res.status(400).json({ message: "Invalid Input" });
            return;
        }
        try {
            const userExistQuery = "SELECT * FROM \"User\" WHERE email = $1";
            const { rows: users } = yield db_1.default.query(userExistQuery, [email]);
            const userExist = users[0];
            if (!userExist) {
                res.status(400).json({ message: "Signup First" });
                return;
            }
            const passwordValidation = yield (0, passwordHash_1.comparePassword)(password, userExist.password);
            if (!passwordValidation) {
                res.status(401).json({ message: "Invalid Password" });
                return;
            }
            req.session.user = { id: userExist.id, details: { name: userExist.name, email } };
            console.log("Session before saving:", req.session);
            req.session.save((err) => {
                if (err) {
                    console.error("❌ Session save error:", err);
                    res.status(500).json({ message: "Session error" });
                    return;
                }
                console.log("✅ Session saved:", req.session);
                res.status(200).json({ message: "User Signed In Successfully" });
            });
        }
        catch (error) {
            console.error("❌ Database query error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    });
}
exports.default = signinController;
