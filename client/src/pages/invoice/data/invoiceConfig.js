// src/data/invoiceConfig.js
// Central configuration: color themes, brand profiles, and default invoice data.
// Contains NO JSX, so it is safe to keep as a plain .js file.
//
// Each brand's `logo` points at a file in client/public/ — Vite serves that
// folder from the web root, so "/logo/x.png" resolves to public/logo/x.png.
// If the file is missing, <BrandLogo> falls back to the inline `mark` SVG.
// Colors live here as plain hex values (not CSS variables) so they can be applied
// as inline styles — html2canvas/html2pdf renders inline styles reliably, whereas
// CSS custom properties are frequently dropped during PDF rasterisation.

/* ------------------------------------------------------------------ */
/*  COLOR THEMES                                                      */
/* ------------------------------------------------------------------ */

export const THEMES = {
  indigo: {
    id: "indigo",
    name: "Indigo",
    primary: "#4f46e5", // matches the dashboard's indigo-600
    dark: "#312e81",
    light: "#eef2ff",
    border: "#c7d2fe",
    muted: "#4b5563",
  },
  blue: {
    id: "blue",
    name: "Navy Blue",
    primary: "#1d4ed8", // links, labels, accents
    dark: "#0f172a", // table header, totals card, headings
    light: "#eff6ff", // tinted panels
    border: "#cbd5e1",
    muted: "#475569",
  },
  golden: {
    id: "golden",
    name: "Golden",
    primary: "#b45309",
    dark: "#451a03",
    light: "#fffbeb",
    border: "#e7d3ae",
    muted: "#6b5433",
  },
  green: {
    id: "green",
    name: "Emerald",
    primary: "#047857",
    dark: "#064e3b",
    light: "#ecfdf5",
    border: "#bbe6d2",
    muted: "#3f6b58",
  },
  teal: {
    id: "teal",
    name: "Deep Teal",
    primary: "#0d9488",
    dark: "#134e4a",
    light: "#f0fdfa",
    border: "#b6dedb",
    muted: "#3f6b69",
  },
  crimson: {
    id: "crimson",
    name: "Crimson",
    primary: "#be123c",
    dark: "#4c0519",
    light: "#fff1f2",
    border: "#eccdd4",
    muted: "#6b4650",
  },
  violet: {
    id: "violet",
    name: "Violet",
    primary: "#6d28d9",
    dark: "#2e1065",
    light: "#f5f3ff",
    border: "#d8d0ee",
    muted: "#544a6b",
  },
  graphite: {
    id: "graphite",
    name: "Graphite",
    primary: "#334155",
    dark: "#020617",
    light: "#f8fafc",
    border: "#cbd5e1",
    muted: "#475569",
  },
};

export const THEME_LIST = Object.values(THEMES);

/* ------------------------------------------------------------------ */
/*  SHARED DEFAULTS                                                   */
/* ------------------------------------------------------------------ */

const SHARED_BANK = {
  bankName: "Wells Fargo Bank",
  accountName: "Datasnap Solutions INC",
  accountNumber: "7199446696",
  achRouting: "031000503",
  wireRouting: "121000248",
  swift: "WFBIUS6S",
  bankAddress:
    "Commerce Square Branch, 2005 Market Street, Suite 150, Philadelphia, PA 19103",
};

const CORPORATE_ADDRESS =
  "3524 Silverside Road, Suite 35B, Wilmington, DE 19810-4929";

const todayLabel = () =>
  new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/** Generates a readable sequential-looking reference, e.g. BC-6A21-4417 */
const makeInvoiceNo = (prefix) => {
  const block = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "0");
  return `${prefix}-${block()}-${block()}`;
};

/* ------------------------------------------------------------------ */
/*  BRAND PROFILES                                                    */
/* ------------------------------------------------------------------ */
// `mark` renders an inline SVG logo so the app has no external image
// dependency. Users can override it per-invoice with an uploaded file or URL.

export const BRANDS = [
  {
    id: "bouncecure",
    logo: "/logo/bounce.png", // served from client/public/logo/
    tabLabel: "Bounce Cure",
    displayName: "BOUNCE",
    displayAccent: "CURE",
    tagline: "Email Deliverability & List Hygiene",
    defaultTheme: "green",
    // Plain data, not JSX — <BrandMark> turns these into SVG elements.
    // Each entry is [tagName, attributes]. `c` is the brand colour.
    mark: (c) => [
      ["rect", { width: 32, height: 32, rx: 8, fill: c }],
      [
        "path",
        {
          d: "M8 12.5 16 18l8-5.5",
          stroke: "#fff",
          strokeWidth: 2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          fill: "none",
        },
      ],
      [
        "rect",
        {
          x: 7,
          y: 10,
          width: 18,
          height: 13,
          rx: 2.5,
          stroke: "#fff",
          strokeWidth: 2,
          fill: "none",
        },
      ],
    ],
  },
  {
    id: "datasnap",
    logo: "/logo/data-snap.png", // served from client/public/logo/
    tabLabel: "Data Snap Solutions",
    displayName: "DATASNAP",
    displayAccent: "SOLUTIONS",
    tagline: "B2B Data Intelligence",
    defaultTheme: "blue",
    mark: (c) => [
      ["rect", { width: 32, height: 32, rx: 8, fill: c }],
      ["ellipse", { cx: 16, cy: 10.5, rx: 7.5, ry: 3, fill: "#fff" }],
      [
        "path",
        {
          d: "M8.5 10.5v11c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-11",
          stroke: "#fff",
          strokeWidth: 2,
          fill: "none",
        },
      ],
      [
        "path",
        {
          d: "M8.5 16c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3",
          stroke: "#fff",
          strokeWidth: 2,
          fill: "none",
        },
      ],
    ],
  },
  {
    id: "abacco",
    logo: "/logo/abacco.png", // served from client/public/logo/
    tabLabel: "Abacco Technology",
    displayName: "ABACCO",
    displayAccent: "TECHNOLOGY",
    tagline: "Applied Engineering Services",
    defaultTheme: "golden",
    mark: (c) => [
      ["rect", { width: 32, height: 32, rx: 8, fill: c }],
      [
        "path",
        {
          d: "M7 9h18M7 16h18M7 23h18",
          stroke: "#fff",
          strokeWidth: 1.75,
          strokeLinecap: "round",
        },
      ],
      ["circle", { cx: 12, cy: 9, r: 2.4, fill: c, stroke: "#fff", strokeWidth: 1.75 }],
      ["circle", { cx: 20, cy: 16, r: 2.4, fill: c, stroke: "#fff", strokeWidth: 1.75 }],
      ["circle", { cx: 14, cy: 23, r: 2.4, fill: c, stroke: "#fff", strokeWidth: 1.75 }],
    ],
  },
];

export const getBrand = (id) => BRANDS.find((b) => b.id === id) || BRANDS[0];

/* ------------------------------------------------------------------ */
/*  DEFAULT INVOICE DATA PER BRAND                                    */
/* ------------------------------------------------------------------ */

const BRAND_DEFAULTS = {
  bouncecure: {
    vendorName: "Bounce Cure",
    vendorPhone: "301-758-4052",
    vendorAddress: CORPORATE_ADDRESS,
    issuerEntity: "BOUNCE CURE",
    itemsHeading: "Verification & Deliverability Services",
    columnLabels: { qty: "Records", bonus: "Included" },
    lineItems: [
      {
        desc: "Bulk email verification — 50k record batch",
        qty: "50,000",
        bonus: "Deliverability report",
        price: 450,
      },
    ],
    terms: [
      "Turnaround: verification results are returned within 24 business hours of upload.",
      "Accuracy: 98% syntax and mailbox accuracy on all verified records.",
      "Re-verification: records flagged as catch-all are re-checked at no extra cost.",
    ],
  },
  datasnap: {
    vendorName: "Datasnap Solutions INC",
    vendorPhone: "301-758-4052",
    vendorAddress: CORPORATE_ADDRESS,
    issuerEntity: "DATASNAP SOLUTIONS INC.",
    itemsHeading: "Data Assets & Services",
    columnLabels: { qty: "Email Records", bonus: "Bonus Campaign" },
    lineItems: [
      {
        desc: "Flour mills, grain exporters and grain importers — Premium Package",
        qty: "10,583",
        bonus: "Free one-time campaign",
        price: 600,
      },
    ],
    terms: [
      "Delivery timeline: the list is delivered within 24–48 business hours of payment confirmation.",
      "Written guarantee: 100% written guarantee on all opt-in verified records supplied.",
      "Replacement policy: invalid contacts within the guaranteed count are replaced 1-to-1 within 2–3 business days.",
    ],
  },
  abacco: {
    vendorName: "Abacco Technology",
    vendorPhone: "301-758-4052",
    vendorAddress: CORPORATE_ADDRESS,
    issuerEntity: "ABACCO TECHNOLOGY",
    itemsHeading: "Engagement & Deliverables",
    columnLabels: { qty: "Units / Hours", bonus: "Coverage" },
    lineItems: [
      {
        desc: "Platform integration engagement — Phase 1",
        qty: "40 hrs",
        bonus: "30-day support window",
        price: 3200,
      },
    ],
    terms: [
      "Scope: work is limited to the deliverables named on this invoice; changes are quoted separately.",
      "Support: 30 days of post-delivery support is included from the date of handover.",
      "Payment: invoices are due on the terms stated above from the invoice date.",
    ],
  },
};

/**
 * Builds a fresh invoice object for a brand.
 * Every field is editable in the UI — this only supplies the starting values.
 */
export function createInvoice(brandId) {
  const brand = getBrand(brandId);
  const d = BRAND_DEFAULTS[brand.id];

  return {
    // logo override (data URL or remote URL); falls back to the SVG mark
    logoUrl: "",
    clientLogoUrl: "",

    // document meta
    invoiceNo: makeInvoiceNo(brand.displayName.slice(0, 2)),
    date: todayLabel(),
    salesperson: "",
    paymentTerms: "Immediate",
    requisitioner: "",
    shippedVia: "Email",

    // agent / referral
    agentBrand: "",
    agentName: "",
    agentRole: "",
    agentEmail: "",

    // client
    clientCompany: "",
    clientEmail: "",
    clientAddress: "",

    // vendor
    vendorName: d.vendorName,
    vendorPhone: d.vendorPhone,
    vendorAddress: d.vendorAddress,

    // issuer / signatory
    issuerEntity: d.issuerEntity,
    issuerAddress: CORPORATE_ADDRESS,
    signatoryName: "",

    // payment
    ...SHARED_BANK,
    checkPayable: d.vendorName,
    checkAddress: CORPORATE_ADDRESS,

    // financials
    taxRate: 0,
    shippingLabel: "Free",

    // content
    itemsHeading: d.itemsHeading,
    columnLabels: d.columnLabels,
    lineItems: d.lineItems.map((i) => ({ ...i })),
    terms: [...d.terms],

    notes: "",
  };
}

/** Builds the initial per-brand state map so tab switches preserve edits. */
export function createAllInvoices() {
  return BRANDS.reduce((acc, b) => {
    acc[b.id] = createInvoice(b.id);
    return acc;
  }, {});
}

export const currency = (n) =>
  "$" +
  (Number(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function computeTotals(invoice) {
  const subtotal = invoice.lineItems.reduce(
    (sum, i) => sum + (parseFloat(i.price) || 0),
    0
  );
  const tax = subtotal * ((parseFloat(invoice.taxRate) || 0) / 100);
  return { subtotal, tax, total: subtotal + tax };
}