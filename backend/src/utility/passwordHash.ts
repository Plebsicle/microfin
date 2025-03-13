import argon2 from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 4096,  // Memory usage (higher = more secure)
    timeCost: 3,       // Number of iterations
    parallelism: 1      // Threads (higher = faster)
});
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await argon2.verify(hashedPassword, password);
}