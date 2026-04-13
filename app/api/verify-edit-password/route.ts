import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  const valid = !!process.env.EDIT_PASSWORD && password === process.env.EDIT_PASSWORD;
  return NextResponse.json({ valid });
}
