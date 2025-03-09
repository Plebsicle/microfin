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
exports.validateSignupDetails = validateSignupDetails;
exports.validateSigninDetails = validateSigninDetails;
exports.amountValidation = amountValidation;
exports.amountTransferValidation = amountTransferValidation;
const zod_1 = __importDefault(require("zod"));
const signupSchema = zod_1.default.object({
    name: zod_1.default.string(),
    email: zod_1.default.string().min(1, { message: "This Field has to be filled" }).email("This is not a Valid Email"),
    password: zod_1.default.string().min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
});
const signinSchema = zod_1.default.object({
    email: zod_1.default.string().min(1, { message: "This Field has to be filled" }).email("This is not a Valid Email"),
    password: zod_1.default.string().min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
});
const accountNumberSchema = zod_1.default.object({
    accountNumber: zod_1.default.string().length(12)
});
function validateSignupDetails(name, email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const validationResult = signupSchema.safeParse({ name, email, password });
        if (validationResult.success)
            return true;
        console.log("Validation Failed", (_a = validationResult.error) === null || _a === void 0 ? void 0 : _a.errors);
        return false;
    });
}
function validateSigninDetails(email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const validationResult = signinSchema.safeParse({ email, password });
        if (validationResult.success)
            return true;
        console.log("Validation Failed", (_a = validationResult.error) === null || _a === void 0 ? void 0 : _a.errors);
        return false;
    });
}
function amountValidation(amount, accountNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
            console.log("Validation Failed: Amount is not a valid number.");
            return false;
        }
        const validationResult = accountNumberSchema.shape.accountNumber.safeParse(accountNumber);
        if (!validationResult.success) {
            console.log("Validation Failed: Account Number not valid", validationResult.error);
            return false;
        }
        return true;
    });
}
function amountTransferValidation(amount, senderAccountNumber, receiverAccountNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
            console.log("Validation Failed: Amount is not a valid number.");
            return false;
        }
        const validationResult1 = accountNumberSchema.shape.accountNumber.safeParse(senderAccountNumber);
        const validationResult2 = accountNumberSchema.shape.accountNumber.safeParse(receiverAccountNumber);
        if (!validationResult1.success) {
            console.log("Validation Failed: Sender Account Number not valid", validationResult1.error);
            return false;
        }
        if (!validationResult2.success) {
            console.log("Validation Failed: Receiver Account Number not valid", validationResult2.error);
            return false;
        }
        return true;
    });
}
