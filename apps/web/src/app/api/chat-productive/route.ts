import { NextResponse } from "next/server";

type ChatRequest = {
  message?: string;
  topic?: string;
  attachments?: Array<{ name: string }>;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ChatRequest;
  const message = body.message?.trim() || "this topic";
  const topic = body.topic?.trim() || "your study session";
  const attachmentNote = body.attachments?.length
    ? ` I also noticed ${body.attachments.length} attached file${body.attachments.length === 1 ? "" : "s"} and would use them as study context once provider logic is connected.`
    : "";

  return NextResponse.json({
    message: [
      `Let's turn **${topic}** into a productive study sprint.`,
      "",
      `You asked: "${message.slice(0, 160)}"`,
      "",
      "A good next sequence is:",
      "1. Define the core idea in one sentence.",
      "2. Work through one concrete example.",
      "3. Answer two recall questions without notes.",
      "4. Mark one task complete before expanding the scope.",
      "",
      `${attachmentNote}`,
    ].join("\n"),
  });
}
