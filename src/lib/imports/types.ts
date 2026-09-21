export type RawCallRecord = {
  id: string;
  date: string;
  bankSlug: string;
  bankName: string;
  bankShort: string;
  headquarters: string;
  analystSlug: string;
  analystName: string;
  analystTitle: string;
  sector: string;
  ticker: string;
  company: string;
  industry: string;
  exchange: string;
  action: string;
  ratingFrom: string | null;
  ratingTo: string;
  priceTargetFrom: number | null;
  priceTargetTo: number | null;
  priceAtCall: number;
  price30d: number | null;
  price90d: number | null;
  price1y: number | null;
  note: string;
};

export type ImportIssue = {
  row: number;
  message: string;
};

export type ImportParseResult = {
  records: RawCallRecord[];
  issues: ImportIssue[];
};

export interface CallFeedAdapter {
  readonly name: string;
  pull(): Promise<RawCallRecord[]>;
}

export const CSV_COLUMNS = [
  "call_id",
  "date",
  "bank_slug",
  "bank_name",
  "analyst_slug",
  "analyst_name",
  "ticker",
  "company",
  "sector",
  "action",
  "rating_to",
  "price_at_call",
  "bank_short",
  "headquarters",
  "analyst_title",
  "industry",
  "exchange",
  "rating_from",
  "price_target_from",
  "price_target_to",
  "price_30d",
  "price_90d",
  "price_1y",
  "note",
] as const;
