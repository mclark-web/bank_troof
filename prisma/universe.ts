export type BankSeed = {
  slug: string;
  name: string;
  shortName: string;
  headquarters: string;
  description: string;
};

export type AnalystSeed = {
  slug: string;
  name: string;
  title: string;
  bankSlug: string;
  sector: string;
  startedYear: number;
};

export type TickerSeed = {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  exchange: string;
};

/** Neutral firm facts. No claim about a research record. */
export const BANKS: BankSeed[] = [
  {
    slug: "evercore",
    name: "Evercore ISI",
    shortName: "Evercore",
    headquarters: "New York",
    description: "Evercore ISI is the research unit of Evercore, an investment bank based in New York.",
  },
  {
    slug: "bernstein",
    name: "Bernstein",
    shortName: "Bernstein",
    headquarters: "New York",
    description: "Bernstein is a sell-side research firm based in New York.",
  },
  {
    slug: "wolfe",
    name: "Wolfe Research",
    shortName: "Wolfe",
    headquarters: "New York",
    description: "Wolfe Research is an equity-research firm based in New York.",
  },
  {
    slug: "jefferies",
    name: "Jefferies",
    shortName: "Jefferies",
    headquarters: "New York",
    description: "Jefferies is an investment bank based in New York.",
  },
  {
    slug: "piper",
    name: "Piper Sandler",
    shortName: "Piper",
    headquarters: "Minneapolis",
    description: "Piper Sandler is an investment bank based in Minneapolis.",
  },
  {
    slug: "goldman",
    name: "Goldman Sachs",
    shortName: "Goldman",
    headquarters: "New York",
    description: "Goldman Sachs is an investment bank based in New York.",
  },
  {
    slug: "morgan-stanley",
    name: "Morgan Stanley",
    shortName: "Morgan Stanley",
    headquarters: "New York",
    description: "Morgan Stanley is an investment bank based in New York.",
  },
  {
    slug: "jpmorgan",
    name: "JPMorgan",
    shortName: "JPMorgan",
    headquarters: "New York",
    description: "JPMorgan is an investment bank based in New York.",
  },
  {
    slug: "ubs",
    name: "UBS",
    shortName: "UBS",
    headquarters: "Zurich",
    description: "UBS is an investment bank based in Zurich.",
  },
  {
    slug: "barclays",
    name: "Barclays",
    shortName: "Barclays",
    headquarters: "London",
    description: "Barclays is an investment bank based in London.",
  },
  {
    slug: "bofa",
    name: "Bank of America",
    shortName: "BofA",
    headquarters: "Charlotte",
    description: "Bank of America is a bank based in Charlotte.",
  },
  {
    slug: "citi",
    name: "Citigroup",
    shortName: "Citi",
    headquarters: "New York",
    description: "Citigroup is an investment bank based in New York.",
  },
  {
    slug: "wells-fargo",
    name: "Wells Fargo",
    shortName: "Wells Fargo",
    headquarters: "San Francisco",
    description: "Wells Fargo is a bank based in San Francisco.",
  },
  {
    slug: "deutsche",
    name: "Deutsche Bank",
    shortName: "Deutsche",
    headquarters: "Frankfurt",
    description: "Deutsche Bank is an investment bank based in Frankfurt.",
  },
  {
    slug: "rbc",
    name: "RBC Capital Markets",
    shortName: "RBC",
    headquarters: "Toronto",
    description: "RBC Capital Markets is the investment-banking division of Royal Bank of Canada, based in Toronto.",
  },
  {
    slug: "wedbush",
    name: "Wedbush Securities",
    shortName: "Wedbush",
    headquarters: "Los Angeles",
    description: "Wedbush Securities is a broker-dealer based in Los Angeles.",
  },
];

const ANALYST_TITLE = "Equity research analyst";

/**
 * Names and firms are the people named on the public sources in the ledger.
 * Sector is the sectors of the tickers they cover here, in first-seen order.
 * startedYear is the year of that analyst's first call in this ledger.
 * Bios are left blank on purpose: nothing here invents a title, a sector history, or a career year.
 */
export const ANALYSTS: AnalystSeed[] = [
  { slug: "aneesha-sherman", name: "Aneesha Sherman", title: ANALYST_TITLE, bankSlug: "bernstein", sector: "Consumer", startedYear: 2026 },
  { slug: "atif-malik", name: "Atif Malik", title: ANALYST_TITLE, bankSlug: "citi", sector: "Technology", startedYear: 2026 },
  { slug: "blayne-curtis", name: "Blayne Curtis", title: ANALYST_TITLE, bankSlug: "jefferies", sector: "Technology", startedYear: 2026 },
  { slug: "brad-erickson", name: "Brad Erickson", title: ANALYST_TITLE, bankSlug: "rbc", sector: "Technology", startedYear: 2026 },
  { slug: "brent-thill", name: "Brent Thill", title: ANALYST_TITLE, bankSlug: "jefferies", sector: "Technology", startedYear: 2026 },
  { slug: "brian-nowak", name: "Brian Nowak", title: ANALYST_TITLE, bankSlug: "morgan-stanley", sector: "Technology", startedYear: 2026 },
  { slug: "dan-ives", name: "Dan Ives", title: ANALYST_TITLE, bankSlug: "wedbush", sector: "Technology", startedYear: 2025 },
  { slug: "david-chiaverini", name: "David Chiaverini", title: ANALYST_TITLE, bankSlug: "jefferies", sector: "Financials", startedYear: 2026 },
  { slug: "david-vogt", name: "David Vogt", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Technology", startedYear: 2026 },
  { slug: "dennis-geiger", name: "Dennis Geiger", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Consumer", startedYear: 2026 },
  { slug: "doug-anmuth", name: "Doug Anmuth", title: ANALYST_TITLE, bankSlug: "jpmorgan", sector: "Media, Technology", startedYear: 2026 },
  { slug: "edison-lee", name: "Edison Lee", title: ANALYST_TITLE, bankSlug: "jefferies", sector: "Technology", startedYear: 2026 },
  { slug: "eric-sheridan", name: "Eric Sheridan", title: ANALYST_TITLE, bankSlug: "goldman", sector: "Media, Technology", startedYear: 2026 },
  { slug: "erik-woodring", name: "Erik Woodring", title: ANALYST_TITLE, bankSlug: "morgan-stanley", sector: "Technology", startedYear: 2025 },
  { slug: "gabriela-borges", name: "Gabriela Borges", title: ANALYST_TITLE, bankSlug: "goldman", sector: "Technology", startedYear: 2026 },
  { slug: "harlan-sur", name: "Harlan Sur", title: ANALYST_TITLE, bankSlug: "jpmorgan", sector: "Technology", startedYear: 2026 },
  { slug: "james-schneider", name: "James Schneider", title: ANALYST_TITLE, bankSlug: "goldman", sector: "Technology", startedYear: 2026 },
  { slug: "jason-bazinet", name: "Jason Bazinet", title: ANALYST_TITLE, bankSlug: "citi", sector: "Media", startedYear: 2026 },
  { slug: "jay-sole", name: "Jay Sole", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Consumer", startedYear: 2026 },
  { slug: "joseph-moore", name: "Joseph Moore", title: ANALYST_TITLE, bankSlug: "morgan-stanley", sector: "Technology", startedYear: 2026 },
  { slug: "karl-keirstead", name: "Karl Keirstead", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Technology", startedYear: 2026 },
  { slug: "ken-herbert", name: "Ken Herbert", title: ANALYST_TITLE, bankSlug: "rbc", sector: "Industrials", startedYear: 2026 },
  { slug: "laurent-yoon", name: "Laurent Yoon", title: ANALYST_TITLE, bankSlug: "bernstein", sector: "Media", startedYear: 2026 },
  { slug: "rishi-jaluria", name: "Rishi Jaluria", title: ANALYST_TITLE, bankSlug: "rbc", sector: "Technology", startedYear: 2026 },
  { slug: "samik-chatterjee", name: "Samik Chatterjee", title: ANALYST_TITLE, bankSlug: "jpmorgan", sector: "Technology", startedYear: 2026 },
  { slug: "sebastiano-petti", name: "Sebastiano Petti", title: ANALYST_TITLE, bankSlug: "jpmorgan", sector: "Media", startedYear: 2026 },
  { slug: "sheila-kahyaoglu", name: "Sheila Kahyaoglu", title: ANALYST_TITLE, bankSlug: "jefferies", sector: "Industrials", startedYear: 2026 },
  { slug: "srini-pajjuri", name: "Srini Pajjuri", title: ANALYST_TITLE, bankSlug: "rbc", sector: "Technology", startedYear: 2026 },
  { slug: "stacy-rasgon", name: "Stacy Rasgon", title: ANALYST_TITLE, bankSlug: "bernstein", sector: "Technology", startedYear: 2026 },
  { slug: "stephen-ju", name: "Stephen Ju", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Technology", startedYear: 2026 },
  { slug: "steven-cahall", name: "Steven Cahall", title: ANALYST_TITLE, bankSlug: "wells-fargo", sector: "Media", startedYear: 2026 },
  { slug: "thomas-champion", name: "Thomas Champion", title: ANALYST_TITLE, bankSlug: "piper", sector: "Media, Technology", startedYear: 2026 },
  { slug: "timothy-arcuri", name: "Timothy Arcuri", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Technology", startedYear: 2026 },
  { slug: "vivek-arya", name: "Vivek Arya", title: ANALYST_TITLE, bankSlug: "bofa", sector: "Technology", startedYear: 2026 },
];

export const TICKERS: TickerSeed[] = [
  { symbol: "AAPL", name: "Apple", sector: "Technology", industry: "Consumer electronics", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft", sector: "Technology", industry: "Software", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA", sector: "Technology", industry: "Semiconductors", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet", sector: "Technology", industry: "Internet", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms", sector: "Technology", industry: "Internet", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon", sector: "Technology", industry: "Internet retail", exchange: "NASDAQ" },
  { symbol: "AVGO", name: "Broadcom", sector: "Technology", industry: "Semiconductors", exchange: "NASDAQ" },
  { symbol: "CRM", name: "Salesforce", sector: "Technology", industry: "Software", exchange: "NYSE" },
  { symbol: "ORCL", name: "Oracle", sector: "Technology", industry: "Software", exchange: "NYSE" },
  { symbol: "AMD", name: "AMD", sector: "Technology", industry: "Semiconductors", exchange: "NASDAQ" },
  { symbol: "JPM", name: "JPMorgan Chase", sector: "Financials", industry: "Banks", exchange: "NYSE" },
  { symbol: "GS", name: "Goldman Sachs Group", sector: "Financials", industry: "Capital markets", exchange: "NYSE" },
  { symbol: "BAC", name: "Bank of America", sector: "Financials", industry: "Banks", exchange: "NYSE" },
  { symbol: "V", name: "Visa", sector: "Financials", industry: "Payments", exchange: "NYSE" },
  { symbol: "MA", name: "Mastercard", sector: "Financials", industry: "Payments", exchange: "NYSE" },
  { symbol: "UNH", name: "UnitedHealth", sector: "Healthcare", industry: "Managed care", exchange: "NYSE" },
  { symbol: "LLY", name: "Eli Lilly", sector: "Healthcare", industry: "Pharmaceuticals", exchange: "NYSE" },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", industry: "Pharmaceuticals", exchange: "NYSE" },
  { symbol: "PFE", name: "Pfizer", sector: "Healthcare", industry: "Pharmaceuticals", exchange: "NYSE" },
  { symbol: "ABBV", name: "AbbVie", sector: "Healthcare", industry: "Pharmaceuticals", exchange: "NYSE" },
  { symbol: "XOM", name: "Exxon Mobil", sector: "Energy", industry: "Integrated oil", exchange: "NYSE" },
  { symbol: "CVX", name: "Chevron", sector: "Energy", industry: "Integrated oil", exchange: "NYSE" },
  { symbol: "COP", name: "ConocoPhillips", sector: "Energy", industry: "Exploration", exchange: "NYSE" },
  { symbol: "WMT", name: "Walmart", sector: "Consumer", industry: "Retail", exchange: "NYSE" },
  { symbol: "COST", name: "Costco", sector: "Consumer", industry: "Retail", exchange: "NASDAQ" },
  { symbol: "NKE", name: "Nike", sector: "Consumer", industry: "Apparel", exchange: "NYSE" },
  { symbol: "SBUX", name: "Starbucks", sector: "Consumer", industry: "Restaurants", exchange: "NASDAQ" },
  { symbol: "MCD", name: "McDonald's", sector: "Consumer", industry: "Restaurants", exchange: "NYSE" },
  { symbol: "HD", name: "Home Depot", sector: "Consumer", industry: "Retail", exchange: "NYSE" },
  { symbol: "PG", name: "Procter & Gamble", sector: "Consumer", industry: "Household products", exchange: "NYSE" },
  { symbol: "CAT", name: "Caterpillar", sector: "Industrials", industry: "Machinery", exchange: "NYSE" },
  { symbol: "GE", name: "GE Aerospace", sector: "Industrials", industry: "Aerospace", exchange: "NYSE" },
  { symbol: "BA", name: "Boeing", sector: "Industrials", industry: "Aerospace", exchange: "NYSE" },
  { symbol: "HON", name: "Honeywell", sector: "Industrials", industry: "Conglomerates", exchange: "NASDAQ" },
  { symbol: "NFLX", name: "Netflix", sector: "Media", industry: "Streaming", exchange: "NASDAQ" },
  { symbol: "DIS", name: "Disney", sector: "Media", industry: "Entertainment", exchange: "NYSE" },
  { symbol: "TMUS", name: "T-Mobile", sector: "Media", industry: "Telecom", exchange: "NASDAQ" },
];

export const AS_OF = new Date("2026-09-21T00:00:00.000Z");
export const PATH_START = new Date("2024-01-02T00:00:00.000Z");
