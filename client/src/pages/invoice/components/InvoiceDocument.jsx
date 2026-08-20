// src/components/InvoiceDocument.jsx
// The invoice "sheet" — this is the node that gets rasterised into the PDF.
//
// Every themed color is applied as an INLINE STYLE rather than a Tailwind class
// or CSS variable. html2canvas only reliably reads computed inline styles, so
// this is what makes the exported PDF match the selected theme.

import { forwardRef, createElement, useState, useEffect } from "react";
import {
  Phone,
  Mail,
  BadgeCheck,
  Landmark,
  ShieldCheck,
  ReceiptText,
  PenLine,
} from "lucide-react";
import { currency, computeTotals } from "../data/invoiceConfig";

/**
 * Renders a brand's logo mark from the plain-data descriptors in
 * invoiceConfig.js. Keeping the shapes as data (rather than JSX) is what lets
 * that config stay a .js file — Vite/esbuild won't parse JSX outside .jsx.
 */
export function BrandMark({ brand, color, className = "h-full w-full" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      {brand.mark(color).map(([tag, props], i) =>
        createElement(tag, { key: i, ...props })
      )}
    </svg>
  );
}

/** True for absolute URLs. Same-origin files must NOT get crossOrigin set. */
const isRemote = (src) => /^https?:\/\//i.test(src || "");

/**
 * Resolves a brand's logo in priority order:
 *   1. a per-invoice override (uploaded file or pasted URL)
 *   2. the brand's default PNG in public/logo/
 *   3. the inline SVG mark, if the PNG is missing or fails to load
 */
export function BrandLogo({ brand, src, color, className = "h-full w-full" }) {
  const resolved = src || brand.logo || "";
  const [failed, setFailed] = useState(false);

  // Clear the error flag when the source changes, so swapping brands or
  // uploading a new file gets a fresh attempt.
  useEffect(() => setFailed(false), [resolved]);

  if (!resolved || failed) {
    return <BrandMark brand={brand} color={color} className={className} />;
  }

  return (
    <img
      src={resolved}
      alt={`${brand.displayName} logo`}
      onError={() => setFailed(true)}
      className={`${className} bg-white object-contain`}
      {...(isRemote(resolved) ? { crossOrigin: "anonymous" } : {})}
    />
  );
}

/* Renders a value, or a muted dash when the field hasn't been filled in yet. */
const Val = ({ children, muted }) =>
  children ? (
    children
  ) : (
    <span style={{ color: muted, opacity: 0.55 }}>—</span>
  );

const InvoiceDocument = forwardRef(function InvoiceDocument(
  { invoice, brand, theme },
  ref
) {
  const { subtotal, tax, total } = computeTotals(invoice);
  const t = theme;
  const cols = invoice.columnLabels || {};

  const panel = {
    backgroundColor: "#ffffff",
    borderColor: t.border,
  };

  return (
    <div
      ref={ref}
      id="invoice-sheet"
      className="w-full max-w-[850px] bg-white p-6 sm:p-8 shadow-2xl rounded-xl border"
      style={{ color: t.dark, borderColor: t.border }}
    >
      {/* ---------------------------------------------------------------- */}
      {/* 1 · Header                                                       */}
      {/* ---------------------------------------------------------------- */}
      <header
        className="avoid-break flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between"
        style={{ borderColor: t.border }}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg">
              <BrandLogo brand={brand} src={invoice.logoUrl} color={t.dark} />
            </div>
            <div>
              <h1 className="font-mono text-lg font-black uppercase leading-none tracking-tight">
                {brand.displayName}{" "}
                <span style={{ color: t.primary }}>{brand.displayAccent}</span>
              </h1>
              <p
                className="pt-1 text-[9px] font-bold uppercase tracking-[0.14em]"
                style={{ color: t.primary }}
              >
                {brand.tagline}
              </p>
            </div>
          </div>

          <div className="max-w-xs space-y-0.5 text-[11px] leading-snug">
            <p className="font-bold">{invoice.vendorName}</p>
            <p style={{ color: t.muted }}>{invoice.vendorAddress}</p>
            <p
              className="flex items-center gap-1.5 pt-0.5 font-mono text-[10px] font-bold"
              style={{ color: t.primary }}
            >
              <Phone size={10} strokeWidth={2.5} />
              {invoice.vendorPhone}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 sm:text-right">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: t.dark }}
          >
            <BadgeCheck size={11} strokeWidth={2.5} />
            Official Invoice
          </div>
          <h2 className="text-2xl font-black uppercase leading-none tracking-tight">
            Invoice
          </h2>
          <div className="space-y-0.5 font-mono text-[11px]" style={{ color: t.muted }}>
            <p>
              No: <span className="font-bold" style={{ color: t.dark }}>{invoice.invoiceNo}</span>
            </p>
            <p>
              Date: <span style={{ color: t.primary }}>{invoice.date}</span>
            </p>
            <p>
              Salesperson:{" "}
              <span style={{ color: t.primary }}>
                <Val muted={t.muted}>{invoice.salesperson}</Val>
              </span>
            </p>
            <p>
              Terms:{" "}
              <span className="font-bold" style={{ color: t.primary }}>
                {invoice.paymentTerms}
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* 2 · Logistics ribbon                                             */}
      {/* ---------------------------------------------------------------- */}
      <div
        className="avoid-break my-3 grid grid-cols-2 gap-3 rounded-lg border px-4 py-2.5 font-mono text-[11px] sm:grid-cols-4"
        style={{ backgroundColor: t.light, borderColor: t.border }}
      >
        {[
          ["Requisitioner", invoice.requisitioner],
          ["Shipped via", invoice.shippedVia],
          ["Invoice ref", invoice.invoiceNo],
          ["Sales rep", invoice.agentName || invoice.salesperson],
        ].map(([label, value]) => (
          <div key={label}>
            <span
              className="block font-sans text-[8px] uppercase tracking-wide"
              style={{ color: t.muted }}
            >
              {label}
            </span>
            <span className="font-bold">
              <Val muted={t.muted}>{value}</Val>
            </span>
          </div>
        ))}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 3 · Billed to / Submitted through                                */}
      {/* ---------------------------------------------------------------- */}
      <div
        className="avoid-break grid grid-cols-1 gap-3 border-b pb-4 md:grid-cols-2"
        style={{ borderColor: t.border }}
      >
        <section className="space-y-1.5 rounded-lg border p-3" style={panel}>
          <div className="flex items-center justify-between gap-2">
            <span
              className="font-mono text-[8px] font-extrabold uppercase tracking-wider"
              style={{ color: t.primary }}
            >
              Billed to
            </span>
            {invoice.clientLogoUrl && (
              <img
                src={invoice.clientLogoUrl}
                alt="Client logo"
                className="h-6 max-w-[100px] object-contain"
                {...(isRemote(invoice.clientLogoUrl)
                  ? { crossOrigin: "anonymous" }
                  : {})}
              />
            )}
          </div>
          <h3 className="text-sm font-bold">
            <Val muted={t.muted}>{invoice.clientCompany}</Val>
          </h3>
          <p className="text-[11px] leading-snug" style={{ color: t.muted }}>
            <Val muted={t.muted}>{invoice.clientAddress}</Val>
          </p>
          <p className="flex items-center gap-1.5 pt-0.5 font-mono text-[11px]">
            <Mail size={11} style={{ color: t.primary }} />
            <span className="font-medium">
              <Val muted={t.muted}>{invoice.clientEmail}</Val>
            </span>
          </p>
        </section>

        <section className="space-y-1.5 rounded-lg border p-3" style={panel}>
          <span
            className="block font-mono text-[8px] font-extrabold uppercase tracking-wider"
            style={{ color: t.primary }}
          >
            Submitted through
          </span>
          <h4 className="text-sm font-bold">
            <Val muted={t.muted}>{invoice.agentBrand}</Val>
          </h4>
          <p className="font-mono text-[11px]" style={{ color: t.muted }}>
            <Val muted={t.muted}>
              {invoice.agentName &&
                `${invoice.agentName}${invoice.agentRole ? ` · ${invoice.agentRole}` : ""}`}
            </Val>
          </p>
          <p className="flex items-center gap-1.5 font-mono text-[11px]">
            <Mail size={11} style={{ color: t.primary }} />
            <span className="font-medium">
              <Val muted={t.muted}>{invoice.agentEmail}</Val>
            </span>
          </p>
        </section>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 4 · Line items                                                   */}
      {/* ---------------------------------------------------------------- */}
      <section className="avoid-break py-3">
        <h3
          className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider"
          style={{ color: t.primary }}
        >
          {invoice.itemsHeading}
        </h3>
        <div
          className="overflow-hidden rounded-lg border"
          style={{ borderColor: t.border }}
        >
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr
                className="font-mono text-[8px] font-semibold uppercase tracking-wider text-white"
                style={{ backgroundColor: t.dark }}
              >
                <th className="w-8 p-2 pl-3 text-center">Sl.</th>
                <th className="p-2">Description</th>
                <th className="p-2 text-center">{cols.qty || "Qty"}</th>
                <th className="p-2 text-center">{cols.bonus || "Included"}</th>
                <th className="p-2 pr-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, i) => (
                <tr
                  key={i}
                  style={{
                    borderTop: i === 0 ? "none" : `1px solid ${t.border}`,
                    backgroundColor: i % 2 ? t.light : "#ffffff",
                  }}
                >
                  <td
                    className="p-2 pl-3 text-center font-mono font-bold"
                    style={{ color: t.primary }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="p-2 font-medium leading-snug">{item.desc}</td>
                  <td className="p-2 text-center font-mono">{item.qty}</td>
                  <td className="p-2 text-center" style={{ color: t.muted }}>
                    {item.bonus}
                  </td>
                  <td className="p-2 pr-3 text-right font-mono font-bold">
                    {currency(item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 5 · Payment details + totals                                     */}
      {/* ---------------------------------------------------------------- */}
      <div
        className="avoid-break grid grid-cols-1 gap-3 border-b pb-4 lg:grid-cols-12"
        style={{ borderColor: t.border }}
      >
        <div className="space-y-2.5 lg:col-span-7">
          {/* Wire & ACH */}
          <section className="space-y-1.5 rounded-lg border p-3" style={panel}>
            <div
              className="flex items-center justify-between border-b pb-1"
              style={{ borderColor: t.border }}
            >
              <span
                className="flex items-center gap-1.5 font-mono text-[10px] font-extrabold uppercase tracking-wider"
                style={{ color: t.primary }}
              >
                <Landmark size={11} /> Wire & ACH instructions
              </span>
              <span
                className="rounded px-1.5 py-0.5 text-[8px] font-bold"
                style={{ backgroundColor: t.light, color: t.primary }}
              >
                {invoice.bankName}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
              {[
                ["Bank name", invoice.bankName],
                ["Account name", invoice.accountName],
                ["Account number", invoice.accountNumber, true],
                ["ACH routing", invoice.achRouting],
                ["Wire routing", invoice.wireRouting],
                ["SWIFT", invoice.swift, true],
              ].map(([label, value, accent]) => (
                <div key={label}>
                  <span className="block text-[8px]" style={{ color: t.muted }}>
                    {label}
                  </span>
                  <span
                    className="font-bold"
                    style={{ color: accent ? t.primary : t.dark }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <p
              className="border-t pt-1 text-[9px] leading-snug"
              style={{ borderColor: t.border, color: t.muted }}
            >
              <span className="font-bold" style={{ color: t.dark }}>
                Bank address:{" "}
              </span>
              {invoice.bankAddress}
            </p>
          </section>

          {/* Check */}
          <section className="space-y-1.5 rounded-lg border p-3" style={panel}>
            <div
              className="flex items-center justify-between border-b pb-1"
              style={{ borderColor: t.border }}
            >
              <span
                className="flex items-center gap-1.5 font-mono text-[10px] font-extrabold uppercase tracking-wider"
                style={{ color: t.primary }}
              >
                <ReceiptText size={11} /> Check payment
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px] sm:grid-cols-2">
              <div>
                <span
                  className="block font-sans text-[8px] uppercase"
                  style={{ color: t.muted }}
                >
                  Payable to
                </span>
                <span className="font-bold">{invoice.checkPayable}</span>
              </div>
              <div>
                <span
                  className="block font-sans text-[8px] uppercase"
                  style={{ color: t.muted }}
                >
                  Memo must include
                </span>
                <span className="font-bold" style={{ color: t.primary }}>
                  Invoice {invoice.invoiceNo}
                </span>
              </div>
            </div>
            <div className="font-mono text-[11px]">
              <span
                className="block font-sans text-[8px] uppercase"
                style={{ color: t.muted }}
              >
                Mailing address
              </span>
              <span className="font-semibold leading-snug">
                {invoice.checkAddress}
              </span>
            </div>
          </section>
        </div>

        {/* Totals card */}
        <div
          className="flex flex-col justify-between rounded-lg p-4 text-white lg:col-span-5"
          style={{ backgroundColor: t.dark }}
        >
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between opacity-80">
              <span>Subtotal</span>
              <span className="font-bold text-white">{currency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between opacity-80">
              <span>Tax ({(parseFloat(invoice.taxRate) || 0).toFixed(2)}%)</span>
              <span>{currency(tax)}</span>
            </div>
            <div className="flex items-center justify-between opacity-80">
              <span>Shipping</span>
              <span className="font-bold uppercase">{invoice.shippingLabel}</span>
            </div>
          </div>

          <div
            className="mt-3 flex items-end justify-between border-t pt-3"
            style={{ borderColor: "rgba(255,255,255,0.22)" }}
          >
            <div>
              <span className="block text-[10px] font-extrabold uppercase tracking-wider">
                Total due
              </span>
              <span className="font-mono text-[9px] opacity-70">
                {invoice.paymentTerms}
              </span>
            </div>
            <span className="font-mono text-2xl font-black leading-none">
              {currency(total)}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 6 · Terms                                                        */}
      {/* ---------------------------------------------------------------- */}
      {invoice.terms.length > 0 && (
        <section
          className="avoid-break space-y-1.5 border-b py-3"
          style={{ borderColor: t.border }}
        >
          <h4
            className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider"
            style={{ color: t.primary }}
          >
            <ShieldCheck size={11} /> Terms & guarantees
          </h4>
          <ul
            className="space-y-1 rounded-lg border p-3 text-[11px] font-medium leading-snug"
            style={{ backgroundColor: t.light, borderColor: t.border }}
          >
            {invoice.terms.map((term, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono font-bold" style={{ color: t.primary }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{term}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 7 · Signatures                                                   */}
      {/* ---------------------------------------------------------------- */}
      <footer className="avoid-break grid grid-cols-1 gap-6 pt-4 text-[11px] sm:grid-cols-2">
        <div className="space-y-1">
          <span
            className="block font-mono text-[8px] font-bold uppercase tracking-wider"
            style={{ color: t.muted }}
          >
            Authorised issuer
          </span>
          <p className="font-bold">{invoice.issuerEntity}</p>
          <p className="text-[10px]" style={{ color: t.muted }}>
            {invoice.issuerAddress}
          </p>
          <div
            className="flex items-baseline gap-2 border-t pt-2 font-mono text-[10px]"
            style={{ borderColor: t.border, color: t.muted }}
          >
            Signature:
            <span className="font-serif text-sm font-bold italic" style={{ color: t.dark }}>
              <Val muted={t.muted}>{invoice.signatoryName}</Val>
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span
            className="flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-wider"
            style={{ color: t.primary }}
          >
            <PenLine size={10} /> Client signature
          </span>
          <p className="font-bold">
            <Val muted={t.muted}>{invoice.clientCompany}</Val>
          </p>
          <div
            className="mt-2 h-14 rounded-lg border"
            style={{ borderColor: t.border, backgroundColor: "#ffffff" }}
          />
          <div
            className="flex items-center justify-between pt-1 font-mono text-[9px]"
            style={{ color: t.muted }}
          >
            <span>Date: ____________</span>
            <span>Print & sign</span>
          </div>
        </div>
      </footer>

      {invoice.notes && (
        <p
          className="avoid-break mt-4 rounded-lg border p-3 text-[10px] leading-snug"
          style={{ backgroundColor: t.light, borderColor: t.border, color: t.muted }}
        >
          <span className="font-bold" style={{ color: t.dark }}>
            Notes:{" "}
          </span>
          {invoice.notes}
        </p>
      )}
    </div>
  );
});

export default InvoiceDocument;