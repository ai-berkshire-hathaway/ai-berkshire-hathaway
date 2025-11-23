// backend/src/services/pyth.ts
import { PYTH } from "../config/chains";

export async function fetchPythPriceUpdateData(
  priceIds: string[] = [PYTH.BTC_USD_PRICE_ID]
): Promise<string[]> {
  const url = new URL(PYTH.HERMES_URL);
  for (const id of priceIds) {
    url.searchParams.append("ids[]", id);
  }
  // 返回hex编码的 bytes[]
  url.searchParams.append("encoding", "hex");

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Hermes request failed: ${res.status} ${res.statusText} ${text}`
    );
  }

  const data = (await res.json()) as any;

  // 官方示例：binary.data 是 bytes[] 更新数据  [oai_citation:9‡docs.euler.finance](https://docs.euler.finance/developers/evk/interacting-with-vaults?utm_source=chatgpt.com)
  if (!data?.binary?.data || !Array.isArray(data.binary.data)) {
    throw new Error(
      `Unexpected Hermes response shape: ${JSON.stringify(
        Object.keys(data || {})
      )}`
    );
  }

  return data.binary.data as string[];
}