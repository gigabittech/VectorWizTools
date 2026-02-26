import { storage } from "../data/storage";
import { hashPassword } from "../utils/auth";

async function seed() {
    try {
        const admin = await storage.getUserByUsername("admin");
        if (!admin) {
            const hashedPassword = await hashPassword("admin123");
            await storage.createUser({
                username: "admin",
                password: hashedPassword,
                role: "admin",
            });
            console.log("✅ Dummy admin user created successfully!");
            console.log("Username: admin");
            console.log("Password: admin123");
        } else {
            console.log("ℹ️ Admin user already exists. Skipping...");
        }
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

seed();
