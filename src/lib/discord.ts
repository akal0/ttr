interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp?: string;
  footer?: {
    text: string;
  };
}

interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
}

export async function sendDiscord(
  webhookUrl: string,
  message: string | DiscordMessage
) {
  if (!webhookUrl) {
    console.warn("Discord webhook URL not provided.");
    return;
  }

  try {
    const payload: DiscordMessage =
      typeof message === "string" ? { content: message } : message;

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Discord webhook failed:", res.status, text);
    }
  } catch (error) {
    console.error("Discord webhook error:", error);
  }
}

// Helper to create embeds easily
export function createEmbed(options: {
  title: string;
  description?: string;
  color: "success" | "error" | "warning" | "info" | "pending";
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}): DiscordMessage {
  const colors = {
    success: 0x10b981, // Green
    error: 0xef4444, // Red
    warning: 0xf59e0b, // Amber
    info: 0x3b82f6, // Blue
    pending: 0x8b5cf6, // Purple
  };

  return {
    embeds: [
      {
        title: options.title,
        description: options.description,
        color: colors[options.color],
        fields: options.fields,
        timestamp: new Date().toISOString(),
        footer: {
          text: "Tom's Trading Room",
        },
      },
    ],
  };
}
