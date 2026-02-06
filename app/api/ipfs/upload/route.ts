import { NextRequest, NextResponse } from "next/server";
import { validateAuthOrReject, isAuthError } from "@/lib/auth";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_PREFIXES = ["image/", "audio/", "application/json"];

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;

    const data = await req.formData();
    const file = data.get("file") as Blob | null;
    const metadata = data.get("metadata") as string | null;

    if (!file && !metadata) {
      return NextResponse.json({ error: "No file or metadata provided" }, { status: 400 });
    }

    const pinataJWT = process.env.PINATA_JWT;
    if (!pinataJWT) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Validate file if present
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 50MB." },
          { status: 400 }
        );
      }

      const fileType = (file as File).type || "";
      if (!ALLOWED_MIME_PREFIXES.some(prefix => fileType.startsWith(prefix))) {
        return NextResponse.json(
          { error: "Invalid file type. Allowed: images, audio, JSON." },
          { status: 400 }
        );
      }
    }

    // We construct the FormData for Pinata specifically
    const pinataFormData = new FormData();

    if (file) {
      pinataFormData.append("file", file);
    } else if (metadata) {
      // If uploading JSON metadata (for NFTs), create a Blob
      const blob = new Blob([metadata], { type: "application/json" });
      pinataFormData.append("file", blob, "metadata.json");
    }

    // Pinata Metadata
    const pinataMetadata = JSON.stringify({
      name: file ? (file as File).name : `metadata-${Date.now()}.json`,
    });
    pinataFormData.append("pinataMetadata", pinataMetadata);

    // Pinata Options
    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    pinataFormData.append("pinataOptions", pinataOptions);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJWT}`,
      },
      body: pinataFormData,
    });

    if (!res.ok) {
      console.error("Pinata upload failed:", res.statusText);
      return NextResponse.json({ error: "Failed to upload to IPFS" }, { status: 500 });
    }

    const json = await res.json();
    const ipfsHash = json.IpfsHash;

    return NextResponse.json({
      hash: ipfsHash,
      url: `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}${ipfsHash}`
    });

  } catch (error: unknown) {
    console.error("IPFS Upload Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
