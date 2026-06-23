import { prisma } from './ultimate-sd/src/lib/prisma';
import { updateUserPlan, revokeUserAccess } from './ultimate-sd/src/app/actions/admin';

async function test() {
    console.log("Checking schema compatibility...");
    try {
        const user = await prisma.user.create({
            data: { email: "testadmin@example.com", role: "ADMIN" }
        });
        console.log("Created test admin user:", user.id);
        await prisma.user.delete({ where: { id: user.id } });
        console.log("Deleted test admin user.");
    } catch (e) {
        console.error("Test failed", e);
    }
}
test();
