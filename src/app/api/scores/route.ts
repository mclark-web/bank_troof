import { entityScores } from "@/lib/queries";

function split(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 40);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const data = await entityScores({
    analysts: split(url.searchParams.get("analysts")),
    banks: split(url.searchParams.get("banks")),
    tickers: split(url.searchParams.get("tickers")),
  });
  return Response.json(data);
}
