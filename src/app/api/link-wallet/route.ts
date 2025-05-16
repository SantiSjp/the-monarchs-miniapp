// app/api/link-wallet/route.ts

import { NextRequest } from "next/server";

type WalletLink = {
  wallet: string;
  fid: number;
};

let inMemoryLinks: WalletLink[] = [];

export async function POST(req: NextRequest) {
  const { wallet, fid } = await req.json();

  if (!wallet || !fid) {
    return new Response("Missing wallet or fid", { status: 400 });
  }

  // Evita duplicatas
  const alreadyLinked = inMemoryLinks.find(
    (entry) => entry.wallet.toLowerCase() === wallet.toLowerCase()
  );

  if (!alreadyLinked) {
    inMemoryLinks.push({ wallet: wallet.toLowerCase(), fid });
  }

  return Response.json({ success: true });
}

// Para fins de demonstração (GET opcional)
export async function GET() {
  return Response.json(inMemoryLinks);
}
