import { db } from "../server/db";
import { tools } from "../shared/schema";
import { eq } from "drizzle-orm";

async function updateTool() {
  try {
    await db.update(tools)
      .set({ category: "Image Tools" })
      .where(eq(tools.tool_id, "instagram-image-download"));

    console.log("Tool category updated to Image Tools successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error updating tool:", error);
    process.exit(1);
  }
}

updateTool();
