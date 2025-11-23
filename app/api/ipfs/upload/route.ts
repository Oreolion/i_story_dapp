import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file = data.get("file") as Blob | null;
    const metadata = data.get("metadata") as string | null;

    if (!file && !metadata) {
      return NextResponse.json({ error: "No file or metadata provided" }, { status: 400 });
    }

    const pinataJWT = process.env.PINATA_JWT;
    if (!pinataJWT) {
      return NextResponse.json({ error: "Server config: Missing PINATA_JWT" }, { status: 500 });
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

    // Pinata Metadata (optional, helps you find files in their dashboard)
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
      throw new Error(`Pinata upload failed: ${res.statusText}`);
    }

    const json = await res.json();
    const ipfsHash = json.IpfsHash;
    
    return NextResponse.json({ 
      hash: ipfsHash, 
      url: `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}${ipfsHash}` 
    });

  } catch (error: any) {
    console.error("IPFS Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}