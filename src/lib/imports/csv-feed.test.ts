import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCallCsv } from "./csv-feed";

const header =
  "call_id,date,bank_slug,bank_name,analyst_slug,analyst_name,ticker,company,sector,action,rating_to,price_at_call,price_target_to,price_90d,note";

describe("parseCallCsv", () => {
  it("parses a valid row and quoted commas in the note", () => {
    const csv = `${header}\nimp-1,2025-03-01,goldman,Goldman Sachs,dana-cho,Dana Cho,NVDA,NVIDIA,Technology,upgrade,buy,100,120,130,"Raised target, citing demand"\n`;
    const result = parseCallCsv(csv);
    assert.equal(result.issues.length, 0);
    assert.equal(result.records.length, 1);
    assert.equal(result.records[0].ticker, "NVDA");
    assert.equal(result.records[0].price90d, 130);
    assert.equal(result.records[0].note, "Raised target, citing demand");
    assert.equal(result.records[0].bankShort, "Goldman Sachs");
  });

  it("reports unknown ratings and missing prices", () => {
    const csv = `${header}\nbad,03/01/2025,goldman,Goldman Sachs,dana-cho,Dana Cho,NVDA,NVIDIA,Technology,upgrade,accumulate,0,,,,\n`;
    const result = parseCallCsv(csv);
    assert.equal(result.records.length, 0);
    assert.equal(result.issues.length, 1);
    assert.match(result.issues[0].message, /rating_to/);
    assert.match(result.issues[0].message, /price_at_call/);
  });
});
