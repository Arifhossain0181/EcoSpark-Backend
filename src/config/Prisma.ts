import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";
import { PrismaClient } from '../generated/prisma/client';

let prismaClient: PrismaClient | null = null;

const normalizePostgresConnectionString = (connectionString: string): string => {
	try {
		const url = new URL(connectionString);
		const sslMode = url.searchParams.get('sslmode');
		const useLibpqCompat = url.searchParams.get('uselibpqcompat');

		if (
			useLibpqCompat !== 'true' &&
			(sslMode === 'prefer' || sslMode === 'require' || sslMode === 'verify-ca')
		) {
			url.searchParams.set('sslmode', 'verify-full');
			return url.toString();
		}
	} catch {
		// Keep original value when URL parsing fails.
	}

	return connectionString;
};

const getPrismaClient = () => {
	if (prismaClient) {
		return prismaClient;
	}

	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL is not configured");
	}

	const normalizedConnectionString = normalizePostgresConnectionString(connectionString);
	const adapter = new PrismaPg({ connectionString: normalizedConnectionString });
	prismaClient = new PrismaClient({ adapter });
	return prismaClient;
};

const prisma = new Proxy({} as PrismaClient, {
	get(_target, property, receiver) {
		const client = getPrismaClient();
		return Reflect.get(client as object, property, receiver);
	},
});

export { prisma };

