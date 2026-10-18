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
  { slug: "aaron-rakers", name: "Aaron Rakers", title: ANALYST_TITLE, bankSlug: "wells-fargo", sector: "Technology", startedYear: 2026 },
  { slug: "akash-tewari", name: "Akash Tewari", title: ANALYST_TITLE, bankSlug: "jefferies", sector: "Healthcare", startedYear: 2026 },
  { slug: "alicia-reese", name: "Alicia Reese", title: ANALYST_TITLE, bankSlug: "wedbush", sector: "Media", startedYear: 2026 },
  { slug: "amit-daryanani", name: "Amit Daryanani", title: ANALYST_TITLE, bankSlug: "evercore", sector: "Technology", startedYear: 2026 },
  { slug: "andrew-mok", name: "Andrew Mok", title: ANALYST_TITLE, bankSlug: "barclays", sector: "Healthcare", startedYear: 2026 },
  { slug: "andy-barish", name: "Andy Barish", title: ANALYST_TITLE, bankSlug: "jefferies", sector: "Consumer", startedYear: 2026 },
  { slug: "aneesha-sherman", name: "Aneesha Sherman", title: ANALYST_TITLE, bankSlug: "bernstein", sector: "Consumer", startedYear: 2026 },
  { slug: "annick-maas", name: "Annick Maas", title: ANALYST_TITLE, bankSlug: "bernstein", sector: "Media", startedYear: 2026 },
  { slug: "atif-malik", name: "Atif Malik", title: ANALYST_TITLE, bankSlug: "citi", sector: "Technology", startedYear: 2026 },
{ slug: "benjamin-black", name: "Benjamin Black", title: ANALYST_TITLE, bankSlug: "deutsche", sector: "Technology", startedYear: 2026 },
{ slug: "betty-jiang", name: "Betty Jiang", title: ANALYST_TITLE, bankSlug: "barclays", sector: "Energy", startedYear: 2026 },
  { slug: "billy-fitzsimmons", name: "Billy Fitzsimmons", title: ANALYST_TITLE, bankSlug: "piper", sector: "Technology", startedYear: 2026 },
  { slug: "blayne-curtis", name: "Blayne Curtis", title: ANALYST_TITLE, bankSlug: "jefferies", sector: "Technology", startedYear: 2026 },
{ slug: "bob-brackett", name: "Bob Brackett", title: ANALYST_TITLE, bankSlug: "bernstein", sector: "Energy", startedYear: 2026 },
  { slug: "brad-erickson", name: "Brad Erickson", title: ANALYST_TITLE, bankSlug: "rbc", sector: "Technology", startedYear: 2026 },
  { slug: "brad-zelnick", name: "Brad Zelnick", title: ANALYST_TITLE, bankSlug: "deutsche", sector: "Technology", startedYear: 2026 },
  { slug: "brent-thill", name: "Brent Thill", title: ANALYST_TITLE, bankSlug: "jefferies", sector: "Technology", startedYear: 2026 },
  { slug: "brian-nowak", name: "Brian Nowak", title: ANALYST_TITLE, bankSlug: "morgan-stanley", sector: "Technology", startedYear: 2026 },
  { slug: "brooke-roach", name: "Brooke Roach", title: ANALYST_TITLE, bankSlug: "goldman", sector: "Consumer", startedYear: 2026 },
  { slug: "bryan-kraft", name: "Bryan Kraft", title: ANALYST_TITLE, bankSlug: "deutsche", sector: "Media", startedYear: 2026 },
  { slug: "chris-caso", name: "Chris Caso", title: ANALYST_TITLE, bankSlug: "wolfe", sector: "Technology", startedYear: 2026 },
  { slug: "chris-schott", name: "Chris Schott", title: ANALYST_TITLE, bankSlug: "jpmorgan", sector: "Healthcare", startedYear: 2026 },
  { slug: "christopher-horvers", name: "Christopher Horvers", title: ANALYST_TITLE, bankSlug: "jpmorgan", sector: "Consumer", startedYear: 2026 },
  { slug: "corey-tarlowe", name: "Corey Tarlowe", title: ANALYST_TITLE, bankSlug: "jefferies", sector: "Consumer", startedYear: 2026 },
  { slug: "dan-ives", name: "Dan Ives", title: ANALYST_TITLE, bankSlug: "wedbush", sector: "Technology", startedYear: 2025 },
  { slug: "daniel-perlin", name: "Daniel Perlin", title: ANALYST_TITLE, bankSlug: "rbc", sector: "Financials", startedYear: 2026 },
  { slug: "david-chiaverini", name: "David Chiaverini", title: ANALYST_TITLE, bankSlug: "jefferies", sector: "Financials", startedYear: 2026 },
  { slug: "david-oconnor", name: "David O'Connor", title: ANALYST_TITLE, bankSlug: "piper", sector: "Technology", startedYear: 2026 },
  { slug: "david-vogt", name: "David Vogt", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Technology", startedYear: 2026 },
  { slug: "dennis-geiger", name: "Dennis Geiger", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Consumer", startedYear: 2026 },
  { slug: "doug-anmuth", name: "Doug Anmuth", title: ANALYST_TITLE, bankSlug: "jpmorgan", sector: "Media, Technology", startedYear: 2026 },
{ slug: "doug-leggate", name: "Doug Leggate", title: ANALYST_TITLE, bankSlug: "wolfe", sector: "Energy", startedYear: 2026 },
  { slug: "douglas-harned", name: "Douglas Harned", title: ANALYST_TITLE, bankSlug: "bernstein", sector: "Industrials", startedYear: 2026 },
  { slug: "ebrahim-poonawala", name: "Ebrahim Poonawala", title: ANALYST_TITLE, bankSlug: "bofa", sector: "Financials", startedYear: 2026 },
  { slug: "edison-lee", name: "Edison Lee", title: ANALYST_TITLE, bankSlug: "jefferies", sector: "Technology", startedYear: 2026 },
  { slug: "eric-sheridan", name: "Eric Sheridan", title: ANALYST_TITLE, bankSlug: "goldman", sector: "Media, Technology", startedYear: 2026 },
  { slug: "erik-woodring", name: "Erik Woodring", title: ANALYST_TITLE, bankSlug: "morgan-stanley", sector: "Technology", startedYear: 2025 },
  { slug: "erika-najarian", name: "Erika Najarian", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Financials", startedYear: 2026 },
  { slug: "gabriela-borges", name: "Gabriela Borges", title: ANALYST_TITLE, bankSlug: "goldman", sector: "Technology", startedYear: 2026 },
  { slug: "gavin-parsons", name: "Gavin Parsons", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Industrials", startedYear: 2026 },
  { slug: "gerard-cassidy", name: "Gerard Cassidy", title: ANALYST_TITLE, bankSlug: "rbc", sector: "Financials", startedYear: 2026 },
  { slug: "glenn-schorr", name: "Glenn Schorr", title: ANALYST_TITLE, bankSlug: "evercore", sector: "Financials", startedYear: 2026 },
  { slug: "harlan-sur", name: "Harlan Sur", title: ANALYST_TITLE, bankSlug: "jpmorgan", sector: "Technology", startedYear: 2026 },
  { slug: "james-schneider", name: "James Schneider", title: ANALYST_TITLE, bankSlug: "goldman", sector: "Technology", startedYear: 2026 },
  { slug: "jason-bazinet", name: "Jason Bazinet", title: ANALYST_TITLE, bankSlug: "citi", sector: "Media", startedYear: 2026 },
  { slug: "jason-goldberg", name: "Jason Goldberg", title: ANALYST_TITLE, bankSlug: "barclays", sector: "Financials", startedYear: 2026 },
  { slug: "jay-sole", name: "Jay Sole", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Consumer", startedYear: 2026 },
{ slug: "jean-ann-salisbury", name: "Jean Ann Salisbury", title: ANALYST_TITLE, bankSlug: "bofa", sector: "Energy", startedYear: 2026 },
  { slug: "jessica-tassan", name: "Jessica Tassan", title: ANALYST_TITLE, bankSlug: "piper", sector: "Healthcare", startedYear: 2026 },
  { slug: "john-colantuoni", name: "John Colantuoni", title: ANALYST_TITLE, bankSlug: "jefferies", sector: "Media", startedYear: 2026 },
  { slug: "john-hodulik", name: "John Hodulik", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Media", startedYear: 2026 },
  { slug: "john-ivankoe", name: "John Ivankoe", title: ANALYST_TITLE, bankSlug: "jpmorgan", sector: "Consumer", startedYear: 2026 },
{ slug: "john-royall", name: "John Royall", title: ANALYST_TITLE, bankSlug: "piper", sector: "Energy", startedYear: 2026 },
  { slug: "jonathan-atkin", name: "Jonathan Atkin", title: ANALYST_TITLE, bankSlug: "rbc", sector: "Media", startedYear: 2026 },
  { slug: "joseph-moore", name: "Joseph Moore", title: ANALYST_TITLE, bankSlug: "morgan-stanley", sector: "Technology", startedYear: 2026 },
{ slug: "josh-silverstein", name: "Josh Silverstein", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Energy", startedYear: 2026 },
  { slug: "karl-keirstead", name: "Karl Keirstead", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Technology", startedYear: 2026 },
  { slug: "keith-horowitz", name: "Keith Horowitz", title: ANALYST_TITLE, bankSlug: "citi", sector: "Financials", startedYear: 2026 },
  { slug: "ken-gawrelski", name: "Ken Gawrelski", title: ANALYST_TITLE, bankSlug: "wells-fargo", sector: "Technology", startedYear: 2026 },
  { slug: "ken-herbert", name: "Ken Herbert", title: ANALYST_TITLE, bankSlug: "rbc", sector: "Industrials", startedYear: 2026 },
  { slug: "kirk-materne", name: "Kirk Materne", title: ANALYST_TITLE, bankSlug: "evercore", sector: "Technology", startedYear: 2026 },
  { slug: "krisztina-katai", name: "Krisztina Katai", title: ANALYST_TITLE, bankSlug: "deutsche", sector: "Consumer", startedYear: 2026 },
  { slug: "laurent-yoon", name: "Laurent Yoon", title: ANALYST_TITLE, bankSlug: "bernstein", sector: "Media", startedYear: 2026 },
  { slug: "manan-gosalia", name: "Manan Gosalia", title: ANALYST_TITLE, bankSlug: "morgan-stanley", sector: "Financials", startedYear: 2026 },
{ slug: "manav-gupta", name: "Manav Gupta", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Energy", startedYear: 2026 },
  { slug: "mark-lipacis", name: "Mark Lipacis", title: ANALYST_TITLE, bankSlug: "evercore", sector: "Technology", startedYear: 2026 },
  { slug: "mark-mahaney", name: "Mark Mahaney", title: ANALYST_TITLE, bankSlug: "evercore", sector: "Technology", startedYear: 2026 },
  { slug: "mark-moerdler", name: "Mark Moerdler", title: ANALYST_TITLE, bankSlug: "bernstein", sector: "Technology", startedYear: 2026 },
  { slug: "matt-bryson", name: "Matt Bryson", title: ANALYST_TITLE, bankSlug: "wedbush", sector: "Technology", startedYear: 2026 },
  { slug: "matthew-boss", name: "Matthew Boss", title: ANALYST_TITLE, bankSlug: "jpmorgan", sector: "Consumer", startedYear: 2026 },
  { slug: "michael-lasser", name: "Michael Lasser", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Consumer", startedYear: 2026 },
  { slug: "michael-turrin", name: "Michael Turrin", title: ANALYST_TITLE, bankSlug: "wells-fargo", sector: "Technology", startedYear: 2026 },
  { slug: "mike-mayo", name: "Mike Mayo", title: ANALYST_TITLE, bankSlug: "wells-fargo", sector: "Financials", startedYear: 2026 },
  { slug: "raimo-lenschow", name: "Raimo Lenschow", title: ANALYST_TITLE, bankSlug: "barclays", sector: "Technology", startedYear: 2026 },
  { slug: "randal-konik", name: "Randal Konik", title: ANALYST_TITLE, bankSlug: "jefferies", sector: "Consumer", startedYear: 2026 },
  { slug: "rishi-jaluria", name: "Rishi Jaluria", title: ANALYST_TITLE, bankSlug: "rbc", sector: "Technology", startedYear: 2026 },
  { slug: "ronald-josey", name: "Ronald Josey", title: ANALYST_TITLE, bankSlug: "citi", sector: "Technology", startedYear: 2026 },
{ slug: "sam-margolin", name: "Sam Margolin", title: ANALYST_TITLE, bankSlug: "wells-fargo", sector: "Energy", startedYear: 2026 },
  { slug: "samik-chatterjee", name: "Samik Chatterjee", title: ANALYST_TITLE, bankSlug: "jpmorgan", sector: "Technology", startedYear: 2026 },
  { slug: "scott-devitt", name: "Scott Devitt", title: ANALYST_TITLE, bankSlug: "wedbush", sector: "Technology", startedYear: 2026 },
  { slug: "sebastiano-petti", name: "Sebastiano Petti", title: ANALYST_TITLE, bankSlug: "jpmorgan", sector: "Media", startedYear: 2026 },
  { slug: "seth-seifman", name: "Seth Seifman", title: ANALYST_TITLE, bankSlug: "jpmorgan", sector: "Industrials", startedYear: 2026 },
  { slug: "sheila-kahyaoglu", name: "Sheila Kahyaoglu", title: ANALYST_TITLE, bankSlug: "jefferies", sector: "Industrials", startedYear: 2026 },
  { slug: "shweta-khajuria", name: "Shweta Khajuria", title: ANALYST_TITLE, bankSlug: "wolfe", sector: "Technology", startedYear: 2026 },
  { slug: "srini-pajjuri", name: "Srini Pajjuri", title: ANALYST_TITLE, bankSlug: "rbc", sector: "Technology", startedYear: 2026 },
  { slug: "stacy-rasgon", name: "Stacy Rasgon", title: ANALYST_TITLE, bankSlug: "bernstein", sector: "Technology", startedYear: 2026 },
  { slug: "stephen-ju", name: "Stephen Ju", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Technology", startedYear: 2026 },
  { slug: "steven-cahall", name: "Steven Cahall", title: ANALYST_TITLE, bankSlug: "wells-fargo", sector: "Media", startedYear: 2026 },
  { slug: "steven-shemesh", name: "Steven Shemesh", title: ANALYST_TITLE, bankSlug: "rbc", sector: "Consumer", startedYear: 2026 },
  { slug: "tal-liani", name: "Tal Liani", title: ANALYST_TITLE, bankSlug: "bofa", sector: "Technology", startedYear: 2026 },
  { slug: "thomas-champion", name: "Thomas Champion", title: ANALYST_TITLE, bankSlug: "piper", sector: "Media, Technology", startedYear: 2026 },
  { slug: "tien-tsin-huang", name: "Tien-tsin Huang", title: ANALYST_TITLE, bankSlug: "jpmorgan", sector: "Financials", startedYear: 2026 },
  { slug: "timothy-arcuri", name: "Timothy Arcuri", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Technology", startedYear: 2026 },
  { slug: "timothy-chiodo", name: "Timothy Chiodo", title: ANALYST_TITLE, bankSlug: "ubs", sector: "Financials", startedYear: 2026 },
  { slug: "tom-omalley", name: "Tom O'Malley", title: ANALYST_TITLE, bankSlug: "barclays", sector: "Technology", startedYear: 2026 },
  { slug: "trung-huynh", name: "Trung Huynh", title: ANALYST_TITLE, bankSlug: "rbc", sector: "Healthcare", startedYear: 2026 },
  { slug: "tyler-radke", name: "Tyler Radke", title: ANALYST_TITLE, bankSlug: "citi", sector: "Technology", startedYear: 2026 },
  { slug: "varun-govindaraj", name: "Varun Govindaraj", title: ANALYST_TITLE, bankSlug: "bernstein", sector: "Technology", startedYear: 2026 },
  { slug: "vivek-arya", name: "Vivek Arya", title: ANALYST_TITLE, bankSlug: "bofa", sector: "Technology", startedYear: 2026 },
  { slug: "wamsi-mohan", name: "Wamsi Mohan", title: ANALYST_TITLE, bankSlug: "bofa", sector: "Technology", startedYear: 2026 },
  { slug: "ygal-arounian", name: "Ygal Arounian", title: ANALYST_TITLE, bankSlug: "wedbush", sector: "Technology", startedYear: 2026 },
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

export const AS_OF = new Date("2026-10-16T00:00:00.000Z");
export const PATH_START = new Date("2024-01-02T00:00:00.000Z");
