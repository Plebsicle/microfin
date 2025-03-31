import { z } from 'zod';

const signupSchema = z.object({
    name: z.string(),
    email: z.string().min(1, { message: "This Field has to be filled" }).email("This is not a Valid Email"),
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
});

const signinSchema = z.object({
    email: z.string().min(1, { message: "This Field has to be filled" }).email("This is not a Valid Email"),
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
});

const accountNumberSchema = z.string().length(12).regex(/^\d+$/, { message: "Account number must be numeric" });

export async function validateSignupDetails(name: string, email: string, password: string): Promise<boolean> {
    const validationResult = signupSchema.safeParse({ name, email, password });
    if (validationResult.success) return true;

    console.log("Validation Failed", validationResult.error.errors);
    return false;
}

export async function validateSigninDetails(email: string, password: string): Promise<boolean> {
    const validationResult = signinSchema.safeParse({ email, password });
    if (validationResult.success) return true;

    console.log("Validation Failed", validationResult.error.errors);
    return false;
}

export async function amountValidation(amount: number, accountNumber: string): Promise<boolean> {
    if (!Number.isFinite(amount) || amount < 0) {
        console.log("Validation Failed: Amount is not a valid number.");
        return false;
    }

    const validationResult = accountNumberSchema.safeParse(accountNumber);
    if (!validationResult.success) {
        console.log("Validation Failed: Account Number not valid", validationResult.error.errors);
        return false;
    }

    return true;
}

export async function amountTransferValidation(amount: number, senderAccountNumber: string, receiverAccountNumber: string): Promise<boolean> {
    if (!Number.isFinite(amount) || amount < 0) {
        console.log("Validation Failed: Amount is not a valid number.");
        return false;
    }

    const validationResult1 = accountNumberSchema.safeParse(senderAccountNumber);
    const validationResult2 = accountNumberSchema.safeParse(receiverAccountNumber);

    if (!validationResult1.success) {
        console.log("Validation Failed: Sender Account Number not valid", validationResult1.error.errors);
        return false;
    }
    if (!validationResult2.success) {
        console.log("Validation Failed: Receiver Account Number not valid", validationResult2.error.errors);
        return false;
    }

    return true;
}
