// src/pages/invoice/components/Invoiceeditor.jsx
// Left-hand editing panel. Purely controlled — every change is pushed up
// through onChange so the preview and the PDF always read the same state.
//
// Styled to match the admin dashboard: white surfaces, gray-200 borders,
// indigo focus rings.

import { useState } from "react";
import { Plus, Trash2, ChevronDown, RotateCcw, Upload, X } from "lucide-react";

const INPUT =
  "w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

/* ------------------------------------------------------------------ */
/*  Small building blocks                                             */
/* ------------------------------------------------------------------ */

function Field({ label, value, onChange, type = "text", placeholder, ...rest }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-gray-500">
        {label}
      </span>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
        {...rest}
      />
    </label>
  );
}

function Section({ title, action, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-gray-200 last:border-0">
      <div className="flex items-center justify-between gap-2 py-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex flex-1 items-center gap-1.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600 transition hover:text-indigo-700"
        >
          <ChevronDown
            size={13}
            className={`shrink-0 transition-transform duration-200 ${
              open ? "" : "-rotate-90"
            }`}
          />
          {title}
        </button>
        {open && action}
      </div>
      {open && <div className="space-y-3 pb-4">{children}</div>}
    </section>
  );
}

/* Upload-or-URL control used for both the company and client logo. */
function LogoPicker({ label, value, onChange, fallback }) {
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </span>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex items-center gap-1 text-[10px] text-gray-400 transition hover:text-rose-600"
          >
            <X size={10} /> Remove
          </button>
        )}
      </div>

      {(value || fallback) && (
        <div className="flex items-center gap-2">
          <img
            src={value || fallback}
            alt=""
            className="h-10 w-auto max-w-[120px] rounded border border-gray-200 bg-white object-contain p-1"
          />
          {!value && (
            <span className="text-[10px] font-medium text-gray-400">Default</span>
          )}
        </div>
      )}

      <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 bg-white py-1.5 text-[11px] text-gray-500 transition hover:border-indigo-400 hover:text-indigo-600">
        <Upload size={11} />
        Upload image
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </label>

      <input
        type="text"
        value={value?.startsWith("data:") ? "" : value || ""}
        placeholder="…or paste an image URL"
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Editor                                                            */
/* ------------------------------------------------------------------ */

export default function InvoiceEditor({ invoice, onChange, onReset, accent, brandLogo }) {
  const set = (key) => (value) => onChange({ ...invoice, [key]: value });

  const setItem = (index, key, value) => {
    const lineItems = invoice.lineItems.map((item, i) =>
      i === index ? { ...item, [key]: value } : item
    );
    onChange({ ...invoice, lineItems });
  };

  const addItem = () =>
    onChange({
      ...invoice,
      lineItems: [
        ...invoice.lineItems,
        { desc: "New line item", qty: "1", bonus: "—", price: 0 },
      ],
    });

  const removeItem = (index) =>
    onChange({
      ...invoice,
      lineItems: invoice.lineItems.filter((_, i) => i !== index),
    });

  const setTerm = (index, value) =>
    onChange({
      ...invoice,
      terms: invoice.terms.map((t, i) => (i === index ? value : t)),
    });

  const addTerm = () => onChange({ ...invoice, terms: [...invoice.terms, ""] });

  const removeTerm = (index) =>
    onChange({ ...invoice, terms: invoice.terms.filter((_, i) => i !== index) });

  const miniBtn =
    "flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold transition";

  return (
    <div className="divide-y divide-gray-200 px-4">
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
          Invoice details
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-[10px] font-medium text-gray-400 transition hover:text-indigo-600"
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      <Section title="Branding & logos">
        <LogoPicker
          label="Company logo"
          value={invoice.logoUrl}
          onChange={set("logoUrl")}
          fallback={brandLogo}
        />
        <LogoPicker
          label="Client logo (optional)"
          value={invoice.clientLogoUrl}
          onChange={set("clientLogoUrl")}
        />
        <p className="text-[10px] leading-snug text-gray-400">
          Leave empty to use this brand's default logo from public/logo/.
        </p>
      </Section>

      <Section title="Document" defaultOpen>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Invoice number" value={invoice.invoiceNo} onChange={set("invoiceNo")} />
          <Field label="Invoice date" value={invoice.date} onChange={set("date")} />
          <Field label="Salesperson" value={invoice.salesperson} onChange={set("salesperson")} placeholder="Full name" />
          <Field label="Payment terms" value={invoice.paymentTerms} onChange={set("paymentTerms")} />
          <Field label="Requisitioner" value={invoice.requisitioner} onChange={set("requisitioner")} />
          <Field label="Shipped via" value={invoice.shippedVia} onChange={set("shippedVia")} />
        </div>
      </Section>

      <Section title="Billed to (client)" defaultOpen>
        <Field label="Company name" value={invoice.clientCompany} onChange={set("clientCompany")} placeholder="Client company" />
        <Field label="Email" value={invoice.clientEmail} onChange={set("clientEmail")} placeholder="name@company.com" />
        <Field label="Address" value={invoice.clientAddress} onChange={set("clientAddress")} placeholder="Street, city, country" />
      </Section>

      <Section title="Submitted through (agent)">
        <Field label="Agent brand" value={invoice.agentBrand} onChange={set("agentBrand")} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact name" value={invoice.agentName} onChange={set("agentName")} />
          <Field label="Role" value={invoice.agentRole} onChange={set("agentRole")} />
        </div>
        <Field label="Contact email" value={invoice.agentEmail} onChange={set("agentEmail")} />
      </Section>

      <Section title="Billed by (vendor)">
        <Field label="Vendor entity" value={invoice.vendorName} onChange={set("vendorName")} />
        <Field label="Phone" value={invoice.vendorPhone} onChange={set("vendorPhone")} />
        <Field label="Address" value={invoice.vendorAddress} onChange={set("vendorAddress")} />
        <div className="pt-1">
          <Field label="Issuer entity" value={invoice.issuerEntity} onChange={set("issuerEntity")} />
        </div>
        <Field label="Issuer address" value={invoice.issuerAddress} onChange={set("issuerAddress")} />
        <Field label="Signatory name" value={invoice.signatoryName} onChange={set("signatoryName")} placeholder="Who signs this invoice" />
      </Section>

      <Section
        title="Line items"
        action={
          <button
            type="button"
            onClick={addItem}
            className={`${miniBtn} border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100`}
          >
            <Plus size={10} /> Add
          </button>
        }
        defaultOpen
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Table heading" value={invoice.itemsHeading} onChange={set("itemsHeading")} />
          <Field
            label="Tax rate (%)"
            type="number"
            value={invoice.taxRate}
            onChange={(v) => onChange({ ...invoice, taxRate: v })}
          />
        </div>

        {invoice.lineItems.map((item, i) => (
          <div
            key={i}
            className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5"
          >
            <div className="flex items-center justify-between">
              <span
                className="font-mono text-[10px] font-bold"
                style={{ color: accent }}
              >
                Item {String(i + 1).padStart(2, "0")}
              </span>
              {invoice.lineItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  aria-label={`Remove item ${i + 1}`}
                  className="text-gray-400 transition hover:text-rose-600"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            <Field label="Description" value={item.desc} onChange={(v) => setItem(i, "desc", v)} />
            <div className="grid grid-cols-3 gap-2">
              <Field label={invoice.columnLabels?.qty || "Qty"} value={item.qty} onChange={(v) => setItem(i, "qty", v)} />
              <Field label={invoice.columnLabels?.bonus || "Included"} value={item.bonus} onChange={(v) => setItem(i, "bonus", v)} />
              <Field label="Price ($)" type="number" value={item.price} onChange={(v) => setItem(i, "price", v)} />
            </div>
          </div>
        ))}
      </Section>

      <Section title="Payment details">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bank name" value={invoice.bankName} onChange={set("bankName")} />
          <Field label="Account name" value={invoice.accountName} onChange={set("accountName")} />
          <Field label="Account number" value={invoice.accountNumber} onChange={set("accountNumber")} />
          <Field label="ACH routing" value={invoice.achRouting} onChange={set("achRouting")} />
          <Field label="Wire routing" value={invoice.wireRouting} onChange={set("wireRouting")} />
          <Field label="SWIFT code" value={invoice.swift} onChange={set("swift")} />
        </div>
        <Field label="Bank address" value={invoice.bankAddress} onChange={set("bankAddress")} />
        <Field label="Cheque payable to" value={invoice.checkPayable} onChange={set("checkPayable")} />
        <Field label="Cheque mailing address" value={invoice.checkAddress} onChange={set("checkAddress")} />
      </Section>

      <Section
        title="Terms & guarantees"
        action={
          <button
            type="button"
            onClick={addTerm}
            className={`${miniBtn} border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100`}
          >
            <Plus size={10} /> Add
          </button>
        }
      >
        {invoice.terms.length === 0 && (
          <p className="text-[11px] text-gray-400">
            No terms yet. Add one to show the terms block on the invoice.
          </p>
        )}
        {invoice.terms.map((term, i) => (
          <div key={i} className="flex items-start gap-2">
            <textarea
              value={term}
              rows={2}
              onChange={(e) => setTerm(i, e.target.value)}
              placeholder="Enter a term or guarantee…"
              className={`${INPUT} resize-none`}
            />
            <button
              type="button"
              onClick={() => removeTerm(i)}
              aria-label={`Remove term ${i + 1}`}
              className="mt-1.5 text-gray-400 transition hover:text-rose-600"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </Section>

      <Section title="Notes">
        <textarea
          value={invoice.notes}
          rows={3}
          onChange={(e) => onChange({ ...invoice, notes: e.target.value })}
          placeholder="Optional footer note shown at the bottom of the invoice…"
          className={`${INPUT} resize-none`}
        />
      </Section>

      <div className="h-4" />
    </div>
  );
}