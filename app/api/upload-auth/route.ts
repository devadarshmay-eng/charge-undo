import { NextResponse } from "next/server";
import ImageKit from "@imagekit/nodejs";

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "private_placeholder_key"
});

export async function GET() {
  try {
    const authParams = imagekit.helper.getAuthenticationParameters();
    return NextResponse.json({
      ...authParams,
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "public_placeholder_key"
    });
  } catch (error: any) {
    console.error("Failed to generate ImageKit auth params:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate authentication parameters" },
      { status: 500 }
    );
  }
}
