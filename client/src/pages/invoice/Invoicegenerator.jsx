// src/pages/invoice/Invoicegenerator.jsx
// Invoice Generator — brand tabs, theme picker, and Edit / View / Download.
//
// Styled to match the admin dashboard: gray-100 page, indigo→purple gradient
// banner, white rounded-xl cards. Sits in the same Sidebar shell as /users.
//
// State is kept per brand, so switching tabs never discards work in progress.

import { useState, useRef, useMemo, useCallback } from "react";
import {
  Pencil,
  Eye,
  Download,
  Printer,
  Check,
  Loader2,
  Palette,
  FileText,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import {
  BRANDS,
  THEMES,
  THEME_LIST,
  getBrand,
  createInvoice,
  createAllInvoices,
} from "./data/invoiceConfig";
import InvoiceEditor from "./components/Invoiceeditor";
import InvoiceDocument, { BrandLogo } from "./components/InvoiceDocument";
import { downloadInvoicePdf } from "../../utils/invoicePdf";

/**
 * Print rules.
 *
 * The workspace uses fixed-height scroll panes. Those clip the sheet to a
 * single screenful when printing, so every ancestor between <html> and
 * #invoice-sheet is flattened back to auto height / visible overflow.
 */
const PRINT_CSS = `
@media print {
  @page { size: letter portrait; margin: 0.4in; }

  html, body, #root,
  #invoice-app, #invoice-shell, #invoice-card,
  #invoice-workspace, #invoice-main, #invoice-scroll {
    height: auto !important;
    max-height: none !important;
    min-height: 0 !important;
    overflow: visible !important;
    display: block !important;
    background: #ffffff !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  .no-print { display: none !important; }

  #invoice-sheet {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  /* Keep cards, the totals block and the signature row from splitting mid-way. */
  .avoid-break {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  /* Without this, browsers drop the theme colours and print a white invoice. */
  *, *::before, *::after {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
`;

export default function InvoiceGenerator() {
  const [brandId, setBrandId] = useState(BRANDS[0].id);
  const [invoices, setInvoices] = useState(createAllInvoices);
  const [themeByBrand, setThemeByBrand] = useState(() =>
    BRANDS.reduce((acc, b) => ({ ...acc, [b.id]: b.defaultTheme }), {})
  );
  const [mode, setMode] = useState("edit"); // "edit" | "view"
  const [status, setStatus] = useState(null); // null | "working" | "done"

  const sheetRef = useRef(null);

  const brand = getBrand(brandId);
  const invoice = invoices[brandId];
  const theme = THEMES[themeByBrand[brandId]] || THEMES.indigo;

  const updateInvoice = useCallback(
    (next) => setInvoices((prev) => ({ ...prev, [brandId]: next })),
    [brandId]
  );

  const resetInvoice = useCallback(() => {
    setInvoices((prev) => ({ ...prev, [brandId]: createInvoice(brandId) }));
    setThemeByBrand((prev) => ({ ...prev, [brandId]: brand.defaultTheme }));
  }, [brandId, brand.defaultTheme]);

  const handleDownload = async () => {
    setStatus("working");
    try {
      await downloadInvoicePdf(sheetRef.current, {
        invoiceNo: invoice.invoiceNo,
        brandName: brand.displayName,
      });
      setStatus("done");
      setTimeout(() => setStatus(null), 2200);
    } catch (err) {
      console.error(err);
      setStatus(null);
      alert(
        `Couldn't generate the PDF: ${err.message}\n\nUse Print instead and choose "Save as PDF".`
      );
    }
  };

  const tabs = useMemo(
    () =>
      BRANDS.map((b) => ({
        ...b,
        active: b.id === brandId,
        accent: (THEMES[themeByBrand[b.id]] || THEMES.indigo).primary,
      })),
    [brandId, themeByBrand]
  );

  /* Buttons sitting on top of the gradient banner. */
  const ghostBtn =
    "flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white";

  return (
    <div id="invoice-app" className="min-h-screen bg-gray-100">
      <style>{PRINT_CSS}</style>

      <div className="no-print">
        <Sidebar setLogoutModal={() => {}} />
      </div>

      <div id="invoice-shell" className="p-4 transition-all duration-300 md:ml-16 md:p-6">
        <div
          id="invoice-card"
          className="overflow-hidden rounded-xl bg-white shadow-lg"
        >
          {/* ================= Gradient banner ================= */}
          <div className="no-print bg-gradient-to-r from-indigo-600 to-purple-700 p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/20 shadow-sm">
                  <FileText className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white md:text-2xl">
                    Invoice Generator
                  </h1>
                  <p className="text-sm text-indigo-200">
                    {brand.tabLabel} · {theme.name} theme
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Edit / View toggle */}
                <div
                  role="tablist"
                  aria-label="Editing mode"
                  className="flex rounded-lg border border-white/25 bg-white/15 p-0.5"
                >
                  {[
                    { id: "edit", label: "Edit", Icon: Pencil },
                    { id: "view", label: "View", Icon: Eye },
                  ].map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={mode === id}
                      onClick={() => setMode(id)}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                        mode === id
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>

                <button onClick={() => window.print()} className={ghostBtn}>
                  <Printer size={13} /> Print
                </button>

                <button
                  onClick={handleDownload}
                  disabled={status === "working"}
                  className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-70"
                >
                  {status === "working" ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Generating…
                    </>
                  ) : status === "done" ? (
                    <>
                      <Check size={13} /> Downloaded
                    </>
                  ) : (
                    <>
                      <Download size={13} /> Download PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ================= Brand tabs ================= */}
          <div
            role="tablist"
            aria-label="Company"
            className="no-print flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-3 md:px-5"
          >
            {tabs.map((b) => (
              <button
                key={b.id}
                role="tab"
                aria-selected={b.active}
                onClick={() => setBrandId(b.id)}
                className={`relative flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  b.active
                    ? "text-indigo-700"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <span className="h-5 w-5 shrink-0 overflow-hidden rounded">
                  <BrandLogo brand={b} color={b.active ? b.accent : "#9ca3af"} />
                </span>
                {b.tabLabel}
                <span
                  className="absolute inset-x-2 bottom-0 h-0.5 rounded-t-full transition-opacity"
                  style={{ backgroundColor: b.accent, opacity: b.active ? 1 : 0 }}
                />
              </button>
            ))}
          </div>

          {/* ================= Theme picker ================= */}
          <div className="no-print flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-3 md:px-5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              <Palette size={12} /> Theme
            </span>
            {THEME_LIST.map((t) => {
              const active = t.id === themeByBrand[brandId];
              return (
                <button
                  key={t.id}
                  onClick={() =>
                    setThemeByBrand((prev) => ({ ...prev, [brandId]: t.id }))
                  }
                  aria-pressed={active}
                  title={`${t.name} theme`}
                  className={`flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-[11px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    active
                      ? "border-indigo-300 bg-white text-gray-900 shadow-sm"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-800"
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-full ring-1 ring-black/10"
                    style={{
                      background: `linear-gradient(135deg, ${t.primary} 50%, ${t.dark} 50%)`,
                    }}
                  />
                  {t.name}
                </button>
              );
            })}
            <span className="ml-auto hidden text-[11px] text-gray-400 lg:block">
              Applied to the preview, the PDF and printed copies
            </span>
          </div>

          {/* ================= Workspace ================= */}
          <div id="invoice-workspace" className="flex flex-col lg:flex-row">
            {mode === "edit" && (
              <aside className="no-print w-full shrink-0 border-b border-gray-200 bg-white lg:max-h-[calc(100vh-260px)] lg:w-[370px] lg:overflow-y-auto lg:border-b-0 lg:border-r xl:w-[410px]">
                <InvoiceEditor
                  invoice={invoice}
                  onChange={updateInvoice}
                  onReset={resetInvoice}
                  accent={theme.primary}
                  brandLogo={brand.logo}
                />
              </aside>
            )}

            <main
              id="invoice-main"
              className="flex flex-1 justify-center overflow-y-auto bg-gray-100 p-4 md:p-6 lg:max-h-[calc(100vh-260px)]"
            >
              <div id="invoice-scroll" className="w-full max-w-[850px]">
                <InvoiceDocument
                  ref={sheetRef}
                  invoice={invoice}
                  brand={brand}
                  theme={theme}
                />
                <p className="no-print py-5 text-center text-[11px] text-gray-400">
                  {mode === "edit"
                    ? "Changes save as you type. Switch to View for a client-ready preview."
                    : "Client-ready preview. Switch to Edit to make changes."}
                </p>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}