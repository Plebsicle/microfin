import zod from 'zod'

const signupSchema = zod.object({
    name : zod.string(),
    email : zod.string().min(1,{message : "This Field has to be filled"}).email("This is not a Valid Email"),
    password : zod.string().min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
});

const signinSchema = zod.object({
    email : zod.string().min(1,{message : "This Field has to be filled"}).email("This is not a Valid Email"),
    password : zod.string().min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
});

const accountNumberSchema = zod.object({
    accountNumber : zod.string().length(12)
});

export async function validateSignupDetails(name : String , email : string , password : string){
    const validationResult = signupSchema.safeParse({name ,email,password});
    if(validationResult.success) return true;
    console.log("Validation Failed",validationResult.error?.errors);
    return false;
}

export async function validateSigninDetails(email : string , password  : string){
    const validationResult = signinSchema.safeParse({email,password});
    if(validationResult.success) return true;
    console.log("Validation Failed",validationResult.error?.errors);
    return false;
}

export async function amountValidation(amount: number, accountNumber: string): Promise<boolean> {
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
}


export async function amountTransferValidation(amount: number, senderAccountNumber: string, receiverAccountNumber: string) {
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
}
