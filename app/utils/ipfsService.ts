export interface IPFSUploadResult {
  hash: string;
  url: string;
}

export class IPFSService {
  private static instance: IPFSService;
  // Use your gateway or a public one as fallback
  private readonly gatewayUrl = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

  static getInstance(): IPFSService {
    if (!IPFSService.instance) {
      IPFSService.instance = new IPFSService();
    }
    return IPFSService.instance;
  }

  /**
   * Uploads JSON metadata (for NFTs/Books) to IPFS via our API route.
   */
  async uploadMetadata(data: any): Promise<IPFSUploadResult> {
    try {
      const formData = new FormData();
      // Send as stringified JSON
      formData.append("metadata", JSON.stringify(data));

      const response = await fetch("/api/ipfs/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to upload metadata");
      }

      return await response.json();
    } catch (error) {
      console.error("IPFS Metadata Upload Error:", error);
      throw error;
    }
  }

  /**
   * Uploads a physical file (Audio/Image) to IPFS via our API route.
   */
  async uploadFile(file: Blob): Promise<IPFSUploadResult> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ipfs/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to upload file");
      }

      return await response.json();
    } catch (error) {
      console.error("IPFS File Upload Error:", error);
      throw error;
    }
  }

  getGatewayUrl(hash: string): string {
    return `${this.gatewayUrl}${hash}`;
  }
}

export const ipfsService = IPFSService.getInstance();