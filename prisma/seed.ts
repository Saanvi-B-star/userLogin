import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const roles = ['admin', 'user', 'manager'];
const firstnames = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'];
const lastnames = ['Smith', 'Brown', 'Johnson', 'Williams', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson'];
const ages = [22, 25, 28, 30, 35, 40];

function getRandom(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
    // Clear the users table before seeding
    await prisma.users.deleteMany();

    const users = Array.from({ length: 100 }).map((_, i) => {
        const firstname = getRandom(firstnames);
        const lastname = getRandom(lastnames);
        const age = getRandom(ages);
        const role = getRandom(roles);
        const isActive = Math.random() > 0.3; // ~70% active
        const phone = `1${Math.floor(100000000 + Math.random() * 900000000)}`;
        return {
            email: `user${i + 1}@example.com`,
            password: `pass${i + 1}`,
            firstname,
            lastname,
            age,
            role,
            isActive,
            phone,
        };
    });

    await prisma.users.createMany({ data: users });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 