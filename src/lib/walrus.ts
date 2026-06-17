const DEFAULT_PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
const DEFAULT_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";

const PUBLISHER = process.env.WALRUS_PUBLISHER || DEFAULT_PUBLISHER;
const AGGREGATOR =
  process.env.WALRUS_AGGREGATOR || process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR || DEFAULT_AGGREGATOR;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function storeBlob(data: string, epochs = 5, contentType = "application/json"): Promise<string> {
  const url = `${PUBLISHER}/v1/blobs?permanent=true&epochs=${epochs}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(url, {
        method: "PUT",
        body: data,
        headers: { "Content-Type": contentType },
      });

      if (!res.ok) throw new Error(`Walrus PUT failed: HTTP ${res.status}`);

      const json = await res.json();
      const blobId = json?.newlyCreated?.blobObject?.blobId ?? json?.alreadyCertified?.blobId;

      if (!blobId) throw new Error(`No blobId in Walrus response: ${JSON.stringify(json)}`);
      return String(blobId);
    } catch (error) {
      if (attempt === 2) throw error;
      await sleep(1000 * (attempt + 1));
    }
  }

  throw new Error("storeBlob exhausted retries");
}

export async function fetchBlob(blobId: string): Promise<string> {
  const url = `${AGGREGATOR}/v1/blobs/${blobId}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.status === 404 && attempt < 2) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error(`Walrus GET failed: HTTP ${res.status}`);
      return await res.text();
    } catch (error) {
      if (attempt === 2) throw error;
      await sleep(1000);
    }
  }

  throw new Error(`fetchBlob failed for ${blobId}`);
}

export function blobUrl(blobId: string): string {
  return `${AGGREGATOR}/v1/blobs/${blobId}`;
}
