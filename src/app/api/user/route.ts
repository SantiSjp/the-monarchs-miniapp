import { getNeynarUser } from "~/lib/neynar";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");
  if (!fid) return new Response("Missing fid", { status: 400 });

  const user = await getNeynarUser(parseInt(fid));
  if (!user) return new Response("User not found", { status: 404 });

  return Response.json({
    fid,
    username: user.username,
    pfp_url: user.pfp_url,
  });
}