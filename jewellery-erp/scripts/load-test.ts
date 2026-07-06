import { prisma } from "../lib/db";
import { Prisma } from "@prisma/client";
import autocannon from "autocannon";
import { exec, ChildProcess } from "child_process";
import http from "http";

const BASE_URL = "http://localhost:3000";
const BYPASS_SECRET = process.env.LOAD_TEST_BYPASS_SECRET || "load-test-local-secret";

function isServerRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, (res) => {
      resolve(true);
    });
    req.on("error", () => {
      resolve(false);
    });
  });
}

function startServer(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    console.log("Starting local dev server...");
    const server = exec("pnpm run dev", {
      env: {
        ...process.env,
        LOAD_TEST_BYPASS_SECRET: BYPASS_SECRET,
      },
    });

    server.stdout?.on("data", (data) => {
      if (data.includes("Ready in") || data.includes("Local:") || data.includes("started")) {
        // Wait another second just in case
        setTimeout(() => resolve(server), 1500);
      }
    });

    server.on("error", (err) => reject(err));

    // Fallback timeout
    setTimeout(() => resolve(server), 8000);
  });
}

async function setupTestData() {
  console.log("Setting up database seed records for load testing...");
  
  // 1. Create Tenant
  let tenant = await prisma.tenant.findFirst({ where: { slug: "load-test-tenant" } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: "Load Testing Store", slug: "load-test-tenant" },
    });
  }

  // 2. Create Business Settings with counter
  await prisma.businessSetting.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      invoicePrefix: "LT-INV",
      invoiceNextSeq: BigInt(1),
    },
    update: {
      invoiceNextSeq: BigInt(1), // Reset counter
    },
  });

  // 3. Create User & Membership
  let user = await prisma.user.findFirst({ where: { email: "load-test-owner@example.com" } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        authUserId: "load-test-owner-auth-id",
        email: "load-test-owner@example.com",
        fullName: "Load Test Owner",
        isSuperAdmin: false,
      },
    });
  }

  const membership = await prisma.userTenantMembership.upsert({
    where: {
      tenantId_userId: {
        userId: user.id,
        tenantId: tenant.id,
      },
    },
    create: {
      userId: user.id,
      tenantId: tenant.id,
      isActive: true,
    },
    update: {
      isActive: true,
    },
  });

  // Create Owner role and assign to user
  let role = await prisma.role.findFirst({
    where: { tenantId: tenant.id, name: "Owner" },
  });
  if (!role) {
    role = await prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: "Owner",
        isSystem: true,
      },
    });
  }

  // Seed permissions
  const permissionsToSeed = ["invoice:create", "invoice:read"];
  for (const permKey of permissionsToSeed) {
    const permission = await prisma.permission.upsert({
      where: { key: permKey },
      update: {},
      create: {
        key: permKey,
        module: "billing",
        description: `Can ${permKey}`,
      },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });
  }

  await prisma.userRole.upsert({
    where: {
      membershipId_roleId: {
        membershipId: membership.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      membershipId: membership.id,
      roleId: role.id,
    },
  });

  // 4. Create Customer
  let customer = await prisma.customer.findFirst({
    where: { tenantId: tenant.id, name: "Load Test Customer" },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: "Load Test Customer",
        phone: "9999999999",
      },
    });
  }

  // 5. Create Daily Metal Rate
  const today = new Date();
  await prisma.metalRate.upsert({
    where: {
      tenantId_metalType_purityFineness_rateDate: {
        tenantId: tenant.id,
        metalType: "gold",
        purityFineness: new Prisma.Decimal("0.916"),
        rateDate: today,
      },
    },
    update: {
      ratePerGram: new Prisma.Decimal("6200.00"),
    },
    create: {
      tenantId: tenant.id,
      metalType: "gold",
      purityFineness: new Prisma.Decimal("0.916"),
      rateDate: today,
      ratePerGram: new Prisma.Decimal("6200.00"),
    },
  });

  return {
    userId: user.id,
    tenantId: tenant.id,
    customerId: customer.id,
  };
}

async function runLoadTest() {
  let serverProcess: ChildProcess | null = null;
  
  try {
    const { userId, tenantId, customerId } = await setupTestData();

    const running = await isServerRunning();
    if (!running) {
      serverProcess = await startServer();
    } else {
      console.log("Next.js server is already running. Proceeding with existing server.");
    }

    console.log("Running concurrency load test via Autocannon...");

    const payload = JSON.stringify({
      customerId,
      invoiceDate: new Date().toISOString(),
      type: "sales",
      placeOfSupply: "27",
      invoiceDiscountType: "NONE",
      invoiceDiscountValue: 0,
      lines: [
        {
          description: "22K Custom Bracelet",
          materialType: "gold",
          grossWeight: 12.5,
          stoneWeight: 0,
          purity: 0.916,
          metalRatePerGram: 6200.0,
          makingChargeType: "PER_GRAM",
          makingChargeValue: 400.0,
          wastageType: "NONE",
          wastageValue: 0,
          stoneChargeType: "NONE",
          stoneCarat: 0,
          stonePieces: 0,
          stoneRate: 0,
          hallmarkCharges: 45.0,
          otherCharges: 0,
          lineDiscountType: "NONE",
          lineDiscountValue: 0,
          quantity: 1,
        },
      ],
    });

    const result = await autocannon({
      url: `${BASE_URL}/api/v1/invoices`,
      connections: 20, // 20 concurrent connections
      duration: 5,     // Run for 5 seconds
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-load-test-bypass-auth": BYPASS_SECRET,
        "x-load-test-user-id": userId,
        "x-load-test-tenant-id": tenantId,
      },
      body: payload,
    });

    console.log("\nLoad Test Summary Results:");
    console.log(`- Total Requests: ${result.requests.total}`);
    console.log(`- Throughput (req/sec): ${result.requests.average}`);
    console.log(`- Avg Latency (ms): ${result.latency.average}`);
    console.log(`- Errors: ${result.errors}`);

    // Verify database counts and invoice sequence gaps
    const finalInvoices = await prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { invoiceNumber: "asc" },
    });

    console.log(`\nVerification:`);
    console.log(`- Created ${finalInvoices.length} invoices successfully.`);

    let duplicatesFound = false;
    let gapsFound = false;
    for (let i = 0; i < finalInvoices.length; i++) {
      const expectedNumber = `LT-INV-${String(i + 1).padStart(4, "0")}`;
      if (finalInvoices[i].invoiceNumber !== expectedNumber) {
        if (finalInvoices.some((inv, idx) => idx !== i && inv.invoiceNumber === finalInvoices[i].invoiceNumber)) {
          duplicatesFound = true;
        } else {
          gapsFound = true;
        }
      }
    }

    if (duplicatesFound) {
      console.error("❌ ERROR: Duplicate invoice numbers were generated under load concurrency!");
      process.exit(1);
    } else if (gapsFound) {
      console.warn("⚠️ WARNING: Gaps were found in the invoice numbers sequence!");
    } else {
      console.log("✅ SUCCESS: Concurrency check passed! Invoice numbers are sequential, gap-free, and unique.");
    }

  } catch (error) {
    console.error("Load test execution error:", error);
    process.exit(1);
  } finally {
    if (serverProcess) {
      console.log("Stopping local server...");
      serverProcess.kill();
    }
  }
}

runLoadTest();
