import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
import dotenv from 'dotenv';

dotenv.config();

const connectionString: string = process.env.DATABASE_URL as string;
console.log("TEST:" + connectionString);
const sql = neon(connectionString);

export async function load() {
    const response = await sql`SELECT version()`;
    const { version } = response[0];
    return {
        version,
    };
}