
import { prisma } from "../src/lib/prisma"

async function main() {
    console.log("Querying database for users...")
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    })

    console.log("Found users:", users)

    if (users.length > 0) {
        console.log("✅ Data persistence verified.")
    } else {
        console.log("❌ No users found.")
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        // We can't easily disconnect the singleton pool but the script will exit
    })
