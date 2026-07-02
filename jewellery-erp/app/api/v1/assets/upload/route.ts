import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

// Standard request body validation for url generation
const UploadRequestSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  purpose: z.string().min(1),
});

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const mockAssetId = searchParams.get("mockAssetId");

  // 1. If it's a mock binary upload request, process file saving
  if (mockAssetId) {
    try {
      const asset = await prisma.fileAsset.findUnique({
        where: { id: mockAssetId },
      });

      if (!asset) {
        return NextResponse.json({ error: "Upload session expired or not found." }, { status: 404 });
      }

      // Read buffer from request
      const buffer = Buffer.from(await request.arrayBuffer());

      // Define local directory in workspace: public/uploads
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Write file locally
      const filePath = path.join(uploadDir, asset.r2Key);
      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({ success: true });
    } catch (err: unknown) {
      console.error("Mock upload binary save error:", err);
      return NextResponse.json({ error: "Failed to write file locally." }, { status: 500 });
    }
  }

  // 2. Otherwise, it's a request to generate a presigned upload URL
  try {
    const session = await authorize("inventory:write");
    const jsonBody = await request.json();
    const input = UploadRequestSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      const assetId = "asset_" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const safeFileName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const r2Key = `${assetId}-${safeFileName}`;

      // In development, if R2 keys are not defined, use the local mock endpoints
      const useMock = !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY;
      
      let uploadUrl = "";
      let publicUrl = "";

      if (useMock) {
        // Mock endpoints inside this file
        uploadUrl = `/api/v1/assets/upload?mockAssetId=${assetId}`;
        publicUrl = `/uploads/${r2Key}`;
      } else {
        // TODO: S3 Client pre-signed URL generation if cloud keys are provided
        uploadUrl = `/api/v1/assets/upload?mockAssetId=${assetId}`; // fallback
        publicUrl = `/uploads/${r2Key}`;
      }

      // Register the FileAsset record
      await prisma.fileAsset.create({
        data: {
          id: assetId,
          tenantId: session.tenantId,
          r2Bucket: useMock ? "local-mock" : (process.env.R2_BUCKET_NAME || "jewellery-assets"),
          r2Key,
          contentType: input.contentType,
          uploadedBy: session.userId,
          purpose: input.purpose,
        },
      });

      return NextResponse.json({
        data: {
          assetId,
          uploadUrl,
          publicUrl,
        },
      });
    });
  } catch (err: unknown) {
    console.error("POST /api/v1/assets/upload error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// Support PUT requests for mock file uploads
export async function PUT(request: Request): Promise<NextResponse> {
  return POST(request);
}
