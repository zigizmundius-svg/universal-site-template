import { handleUpload } from "@vercel/blob/client";

export async function POST(request) {
  try {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && new URL(origin).host !== host) return Response.json({ error: "Недопустимый источник запроса" }, { status: 403 });
    const body = await request.json();
    const result = await handleUpload({
      body, request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
        maximumSizeInBytes: 10 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ purpose: "furniture-visualizer" })
      }),
      onUploadCompleted: async () => {}
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error?.message || "Не удалось загрузить изображение" }, { status: 400 });
  }
}
