import { NextResponse } from "next/server";
import { sendDiscord, createEmbed } from "@/lib/discord";

export async function POST(req: Request) {
  await sendDiscord(
    process.env.DISCORD_INITIATE_WEBHOOK_URL!,
    createEmbed({
      title: "🔥 Checkout initiated",
      description: "Someone's started a checkout!",
      color: "info",
    })
  );

  return NextResponse.json({ ok: true });
}
