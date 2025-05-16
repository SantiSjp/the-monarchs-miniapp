import { getNeynarUser } from "~/lib/neynar";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { fid: string } }
) {
  const fid = Number(params.fid);
  if (!fid) return new Response("Missing fid", { status: 400 });

  const user = await getNeynarUser(fid);
  if (!user) return new Response("User not found", { status: 404 });

  return Response.json({
    fid,
    username: user.username,
    pfp_url: user.pfp_url,
  });
}