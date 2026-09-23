export type BankSeed = {
  slug: string;
  name: string;
  shortName: string;
  headquarters: string;
  bias: number;
  description: string;
};

export type AnalystSeed = {
  slug: string;
  name: string;
  title: string;
  bankSlug: string;
  sector: string;
  startedYear: number;
  personal: number;
};

export type TickerSeed = {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  exchange: string;
};

export const BANKS: BankSeed[] = [
  {
    slug: "evercore",
    name: "Evercore ISI",
    shortName: "Evercore",
    headquarters: "New York",
    bias: 0.82,
    description:
      "Sample independent-research desk used to show a high-scoring franchise. Figures are generated. They are not Evercore's actual recommendation record.",
  },
  {
    slug: "bernstein",
    name: "Bernstein",
    shortName: "Bernstein",
    headquarters: "New York",
    bias: 0.76,
    description:
      "Sample profile for a research franchise with a tighter hit rate in this demo. Not a statement about Bernstein's published research.",
  },
  {
    slug: "wolfe",
    name: "Wolfe Research",
    shortName: "Wolfe",
    headquarters: "New York",
    bias: 0.72,
    description:
      "Sample boutique desk. Sector mix and grades exist so GradedCalls Analysts can show how a smaller roster rolls up to a firm score.",
  },
  {
    slug: "jefferies",
    name: "Jefferies",
    shortName: "Jefferies",
    headquarters: "New York",
    bias: 0.64,
    description:
      "Sample full-service desk sitting near the middle of the demo leaderboard. Useful as a baseline, not as a report on Jefferies.",
  },
  {
    slug: "piper",
    name: "Piper Sandler",
    shortName: "Piper",
    headquarters: "Minneapolis",
    bias: 0.6,
    description:
      "Sample regional franchise with healthcare and technology coverage in the demo universe.",
  },
  {
    slug: "goldman",
    name: "Goldman Sachs",
    shortName: "Goldman",
    headquarters: "New York",
    bias: 0.56,
    description:
      "Sample bulge-bracket book. Goldman Sachs is a familiar label so the product can be searched the way a reader would. The score is fictional.",
  },
  {
    slug: "morgan-stanley",
    name: "Morgan Stanley",
    shortName: "Morgan Stanley",
    headquarters: "New York",
    bias: 0.52,
    description:
      "Sample Morgan Stanley research roster. Accuracy, targets, and notes are simulated for the demo and are not the firm's record.",
  },
  {
    slug: "jpmorgan",
    name: "JPMorgan",
    shortName: "JPMorgan",
    headquarters: "New York",
    bias: 0.48,
    description:
      "Sample JPMorgan desk covering financials, technology, and industrials. Aggregation here is call-weighted, so one busy analyst can move the firm.",
  },
  {
    slug: "ubs",
    name: "UBS",
    shortName: "UBS",
    headquarters: "Zurich",
    bias: 0.4,
    description:
      "Sample UBS franchise included so the leaderboard is not only New York desks. Performance is generated.",
  },
  {
    slug: "barclays",
    name: "Barclays",
    shortName: "Barclays",
    headquarters: "London",
    bias: 0.36,
    description:
      "Sample Barclays book with financials and energy coverage. A below-median demo score, labeled as such everywhere it appears.",
  },
  {
    slug: "bofa",
    name: "Bank of America",
    shortName: "BofA",
    headquarters: "Charlotte",
    bias: 0.34,
    description:
      "Sample Bank of America roster. The firm score is the average of its demo calls, not an average of analyst averages.",
  },
  {
    slug: "citi",
    name: "Citigroup",
    shortName: "Citi",
    headquarters: "New York",
    bias: 0.28,
    description:
      "Sample Citi desk that lands toward the bottom of this vintage on purpose, so the worst-offender view has something to show.",
  },
  {
    slug: "wells-fargo",
    name: "Wells Fargo",
    shortName: "Wells Fargo",
    headquarters: "San Francisco",
    bias: 0.26,
    description:
      "Sample Wells Fargo coverage in consumer and energy. Misses are graded the same way as every other desk.",
  },
  {
    slug: "deutsche",
    name: "Deutsche Bank",
    shortName: "Deutsche",
    headquarters: "Frankfurt",
    bias: 0.2,
    description:
      "Sample Deutsche Bank desk anchored at the low end of the demo. The point of the page is the grade, not a claim about the bank.",
  },
];

export const ANALYSTS: AnalystSeed[] = [
  { slug: "helen-voss", name: "Helen Voss", title: "Managing Director", bankSlug: "evercore", sector: "Technology", startedYear: 2009, personal: 0.06 },
  { slug: "marcus-ellison", name: "Marcus Ellison", title: "Managing Director", bankSlug: "evercore", sector: "Healthcare", startedYear: 2006, personal: 0.04 },
  { slug: "priya-raman", name: "Priya Raman", title: "Director", bankSlug: "evercore", sector: "Consumer", startedYear: 2014, personal: 0.03 },
  { slug: "jonathan-hale", name: "Jonathan Hale", title: "Managing Director", bankSlug: "bernstein", sector: "Technology", startedYear: 2008, personal: 0.05 },
  { slug: "clara-nunez", name: "Clara Nunez", title: "Managing Director", bankSlug: "bernstein", sector: "Financials", startedYear: 2011, personal: 0.02 },
  { slug: "owen-briggs", name: "Owen Briggs", title: "Director", bankSlug: "bernstein", sector: "Industrials", startedYear: 2015, personal: 0.04 },
  { slug: "nina-okonkwo", name: "Nina Okonkwo", title: "Managing Director", bankSlug: "wolfe", sector: "Healthcare", startedYear: 2007, personal: 0.05 },
  { slug: "samuel-drake", name: "Samuel Drake", title: "Director", bankSlug: "wolfe", sector: "Energy", startedYear: 2013, personal: 0.02 },
  { slug: "alice-chen", name: "Alice Chen", title: "Managing Director", bankSlug: "jefferies", sector: "Technology", startedYear: 2010, personal: 0.04 },
  { slug: "robert-lang", name: "Robert Lang", title: "Managing Director", bankSlug: "jefferies", sector: "Consumer", startedYear: 2005, personal: -0.02 },
  { slug: "fatima-shah", name: "Fatima Shah", title: "Director", bankSlug: "jefferies", sector: "Healthcare", startedYear: 2016, personal: 0.03 },
  { slug: "grace-lindstrom", name: "Grace Lindstrom", title: "Managing Director", bankSlug: "piper", sector: "Healthcare", startedYear: 2009, personal: 0.02 },
  { slug: "theo-marchetti", name: "Theo Marchetti", title: "Director", bankSlug: "piper", sector: "Technology", startedYear: 2017, personal: 0.05 },
  { slug: "daniel-cho", name: "Daniel Cho", title: "Managing Director", bankSlug: "goldman", sector: "Technology", startedYear: 2004, personal: 0.08 },
  { slug: "sophie-laurent", name: "Sophie Laurent", title: "Managing Director", bankSlug: "goldman", sector: "Financials", startedYear: 2008, personal: -0.04 },
  { slug: "andrej-petrov", name: "Andrej Petrov", title: "Director", bankSlug: "goldman", sector: "Energy", startedYear: 2012, personal: 0.01 },
  { slug: "camille-brooks", name: "Camille Brooks", title: "Managing Director", bankSlug: "morgan-stanley", sector: "Technology", startedYear: 2007, personal: 0.03 },
  { slug: "hassan-iqbal", name: "Hassan Iqbal", title: "Managing Director", bankSlug: "morgan-stanley", sector: "Consumer", startedYear: 2011, personal: 0.0 },
  { slug: "elena-vasquez", name: "Elena Vasquez", title: "Director", bankSlug: "morgan-stanley", sector: "Healthcare", startedYear: 2015, personal: 0.04 },
  { slug: "william-hart", name: "William Hart", title: "Managing Director", bankSlug: "jpmorgan", sector: "Financials", startedYear: 2003, personal: 0.02 },
  { slug: "mei-lin", name: "Mei Lin", title: "Managing Director", bankSlug: "jpmorgan", sector: "Technology", startedYear: 2010, personal: 0.06 },
  { slug: "christopher-adeyemi", name: "Christopher Adeyemi", title: "Director", bankSlug: "jpmorgan", sector: "Industrials", startedYear: 2014, personal: -0.03 },
  { slug: "ingrid-solberg", name: "Ingrid Solberg", title: "Managing Director", bankSlug: "ubs", sector: "Industrials", startedYear: 2006, personal: 0.02 },
  { slug: "patrick-nguyen", name: "Patrick Nguyen", title: "Director", bankSlug: "ubs", sector: "Technology", startedYear: 2016, personal: -0.02 },
  { slug: "rebecca-holt", name: "Rebecca Holt", title: "Managing Director", bankSlug: "barclays", sector: "Financials", startedYear: 2009, personal: 0.0 },
  { slug: "omar-farouk", name: "Omar Farouk", title: "Director", bankSlug: "barclays", sector: "Energy", startedYear: 2013, personal: -0.03 },
  { slug: "laura-kim", name: "Laura Kim", title: "Managing Director", bankSlug: "bofa", sector: "Consumer", startedYear: 2008, personal: 0.02 },
  { slug: "james-whitfield", name: "James Whitfield", title: "Managing Director", bankSlug: "bofa", sector: "Technology", startedYear: 2005, personal: -0.05 },
  { slug: "anika-desai", name: "Anika Desai", title: "Director", bankSlug: "bofa", sector: "Healthcare", startedYear: 2017, personal: 0.04 },
  { slug: "thomas-berger", name: "Thomas Berger", title: "Managing Director", bankSlug: "citi", sector: "Financials", startedYear: 2004, personal: -0.02 },
  { slug: "yuki-tanaka", name: "Yuki Tanaka", title: "Director", bankSlug: "citi", sector: "Technology", startedYear: 2015, personal: -0.04 },
  { slug: "natalie-porter", name: "Natalie Porter", title: "Managing Director", bankSlug: "wells-fargo", sector: "Consumer", startedYear: 2010, personal: 0.0 },
  { slug: "george-halloran", name: "George Halloran", title: "Director", bankSlug: "wells-fargo", sector: "Energy", startedYear: 2012, personal: -0.04 },
  { slug: "lukas-weber", name: "Lukas Weber", title: "Managing Director", bankSlug: "deutsche", sector: "Industrials", startedYear: 2006, personal: -0.03 },
  { slug: "amira-hassan", name: "Amira Hassan", title: "Director", bankSlug: "deutsche", sector: "Financials", startedYear: 2014, personal: -0.05 },
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
