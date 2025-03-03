import bcrypt from 'bcrypt';

const saltRounds = 12;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  const match = await bcrypt.compare(password, hashedPassword);
  return match;
}