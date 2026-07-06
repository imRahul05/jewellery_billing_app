import { prismaAdmin } from "./lib/db";
import { Prisma } from "@prisma/client";

async function main() {
  try {
    const res = await prismaAdmin.tenant.findMany();
    console.log("Success:", res.length);
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
