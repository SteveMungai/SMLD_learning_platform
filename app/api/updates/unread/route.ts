import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unreadCount } from "@/lib/updates";

// Used by the navbar bell. Returns 0 for signed-out visitors rather than an error.
export async function GET() {
  const user = (await getServerSession(authOptions))?.user;
  if (!user?.id) return NextResponse.json({ count: 0 });
  try {
    return NextResponse.json({ count: await unreadCount({ id: user.id, role: user.role }) });
  } catch (err) {
    console.error("Unread count failed:", err);
    return NextResponse.json({ count: 0 });
  }
}
