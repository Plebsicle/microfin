import zod from 'zod'

const signupSchema = zod.object({
    name : zod.string(),
    email : zod.string().min(1,{message : "This Field has to be filled"}).email("This is not a Valid Email"),
    password : zod.string().min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
});

export async function validateSignupDetails(name : String , email : string , password : string){
    const validationResult = signupSchema.safeParse({name ,email,password});
    if(validationResult.success) return true;
    console.log("Validation Failed",validationResult.error?.errors);
    return false;
}
