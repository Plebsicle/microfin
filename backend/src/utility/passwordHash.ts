import argon2 from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id, // Use Argon2id (most secure variant)
    memoryCost: 2 ** 10,   // 1MB memory (low for better performance)
    timeCost: 2,           // 1 iteration (fastest setting)
    parallelism: 1         // Single-threaded (avoids event loop blocking)
  });
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await argon2.verify(hashedPassword, password);
}
