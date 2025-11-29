import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const id = Number(searchParams.get("id"));

  const apiKey = process.env.PEXELS_API_KEY;
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    query!
  )}&per_page=1`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: apiKey! },
    });

    const data = await res.json();

    const imageUrl = data.photos?.[0]?.src?.medium || null;

    await prisma.todo.update({
      where: { id },
      data: { imageUrl },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch image" });
  }
}
