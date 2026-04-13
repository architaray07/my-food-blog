import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  const valid = password === process.env.ADMIN_PASSWORD;
  return NextResponse.json({ valid });
}
