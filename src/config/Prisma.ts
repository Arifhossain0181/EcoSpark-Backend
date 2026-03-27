import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";
import { PrismaClient } from '../generated/prisma/client';

let prismaClient: PrismaClient | null = null;

const getPrismaClient = () => {
	if (prismaClient) {
		return prismaClient;
	}

	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL is not configured");
	}

	const adapter = new PrismaPg({ connectionString });
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

