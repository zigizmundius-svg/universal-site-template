const API = "https://api.ideal.house/api/v1/furnitureTryOn";
function validImageUrl(value) {
  try { const u = new URL(value); return u.protocol === "https:"; } catch { return false; }
}
export async function POST(request) {
  const key = process.env.IDEALHOUSE_API_KEY;
  if (!key) return Response.json({ error: "ИИ-модуль ещё не подключён. Нужен серверный ключ Ideal House API." }, { status: 503 });
  try {
    const { roomImageUrl, furnitureImageUrl, modelType = "Base", prompt = "" } = await request.json();
    if (!validImageUrl(roomImageUrl) || !validImageUrl(furnitureImageUrl)) return Response.json({ error: "Изображения должны быть загружены и иметь публичные HTTPS-ссылки." }, { status: 400 });
    const response = await fetch(API + "/generate", { method: "POST", headers: { "APIKEY": key, "Content-Type": "application/json" }, body: JSON.stringify({ imageUrl: roomImageUrl, furnitureList: [{ imageUrl: furnitureImageUrl }], modelType, prompt }) });
    const data = await response.json();
    if (!response.ok || data.code !== 0) return Response.json({ error: data.message || "Провайдер не принял задачу", providerCode: data.code }, { status: 502 });
    return Response.json({ taskId: String(data.data), message: "Задача создана" });
  } catch (error) { return Response.json({ error: error?.message || "Ошибка запуска визуализации" }, { status: 500 }); }
}
export async function GET(request) {
  const key = process.env.IDEALHOUSE_API_KEY;
  if (!key) return Response.json({ error: "ИИ-модуль не подключён" }, { status: 503 });
  const taskId = new URL(request.url).searchParams.get("taskId");
  if (!taskId || !/^\\d+$/.test(taskId)) return Response.json({ error: "Некорректный taskId" }, { status: 400 });
  try {
    const response = await fetch(API + "/result?taskId=" + encodeURIComponent(taskId), { headers: { "APIKEY": key }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.code !== 0) return Response.json({ error: data.message || "Не удалось получить результат" }, { status: 502 });
    const task = data.data || {};
    return Response.json({ status: task.status, percentage: task.percentage || 0, waitNumber: task.waitNumber || 0, resultUrl: task.output?.resultUrl || null });
  } catch (error) { return Response.json({ error: error?.message || "Ошибка проверки результата" }, { status: 500 }); }
}
