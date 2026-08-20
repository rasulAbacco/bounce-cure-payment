// src/utils/invoicePdf.js
// Exports the invoice sheet to PDF.
//
// Uses html2canvas + jsPDF directly (instead of the html2pdf wrapper) so we
// control cropping and pagination ourselves. Both load from CDN on first use —
// no package.json changes needed. To bundle them instead:
//   npm i html2canvas jspdf
// ...then swap ensureLibs() for dynamic imports.

const LIBS = [
  {
    name: "html2canvas",
    src: "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
    ready: () => typeof window.html2canvas === "function",
  },
  {
    name: "jsPDF",
    src: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    ready: () => typeof window.jspdf?.jsPDF === "function",
  },
];

const loaders = {};

function loadScript({ name, src, ready }) {
  if (ready()) return Promise.resolve();
  if (loaders[name]) return loaders[name];

  loaders[name] = new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () =>
      ready() ? resolve() : reject(new Error(`${name} loaded but did not register`));
    el.onerror = () => {
      delete loaders[name];
      reject(new Error(`Could not load ${name}`));
    };
    document.head.appendChild(el);
  });

  return loaders[name];
}

const ensureLibs = () => Promise.all(LIBS.map(loadScript));

const safeName = (s) => String(s).replace(/[^\w.-]+/g, "_").replace(/_+/g, "_");

/**
 * html2canvas clones the document with every scroll container reset to zero,
 * but crops using the element's CURRENT on-screen rect. If anything between the
 * sheet and <body> is scrolled, the crop lands in the wrong place and the PDF
 * comes out clipped. So: park every scrollable ancestor at 0, capture, restore.
 */
function freezeScroll(element) {
  const saved = [];
  let node = element.parentElement;

  while (node && node !== document.body && node !== document.documentElement) {
    if (node.scrollTop !== 0 || node.scrollLeft !== 0) {
      saved.push({ node, top: node.scrollTop, left: node.scrollLeft });
      node.scrollTop = 0;
      node.scrollLeft = 0;
    }
    node = node.parentElement;
  }

  const win = { x: window.scrollX, y: window.scrollY };
  window.scrollTo(0, 0);

  return () => {
    saved.forEach(({ node: n, top, left }) => {
      n.scrollTop = top;
      n.scrollLeft = left;
    });
    window.scrollTo(win.x, win.y);
  };
}

/** Preview-only styling that rasterises badly. Removed for capture, restored after. */
function stripPreviewChrome(element) {
  const saved = {
    boxShadow: element.style.boxShadow,
    borderRadius: element.style.borderRadius,
    border: element.style.border,
  };
  element.style.boxShadow = "none";
  element.style.borderRadius = "0";
  element.style.border = "none";
  return () => Object.assign(element.style, saved);
}

/* Letter portrait, in inches. */
const PAGE_W = 8.5;
const PAGE_H = 11;
const MARGIN = 0.3;
const AVAIL_W = PAGE_W - MARGIN * 2; // 7.9"
const AVAIL_H = PAGE_H - MARGIN * 2; // 10.4"

/** Below this shrink factor text gets too small — page it instead. */
const MIN_FIT_SCALE = 0.62;

/**
 * @param {HTMLElement} element  the #invoice-sheet node
 * @param {{invoiceNo: string, brandName: string}} meta
 * @returns {Promise<{pages: number, fitted: boolean}>}
 */
export async function downloadInvoicePdf(element, { invoiceNo, brandName }) {
  if (!element) throw new Error("Invoice sheet not found on the page");

  await ensureLibs();

  const restoreScroll = freezeScroll(element);
  const restoreChrome = stripPreviewChrome(element);

  let canvas;
  try {
    // No windowWidth / windowHeight overrides. Passing them makes html2canvas
    // re-lay out the page at a different width while still cropping with the
    // rect measured at the real viewport width — which clips the output.
    canvas = await window.html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      removeContainer: true,
      imageTimeout: 15000,
    });
  } finally {
    restoreChrome();
    restoreScroll();
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "in", format: "letter", orientation: "portrait" });
  const filename = `${safeName(brandName)}_Invoice_${safeName(invoiceNo)}.pdf`;

  const ratio = canvas.height / canvas.width;
  const naturalH = AVAIL_W * ratio; // height if drawn at full page width

  // Case 1 — fits as-is.
  if (naturalH <= AVAIL_H) {
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.98),
      "JPEG",
      MARGIN,
      MARGIN,
      AVAIL_W,
      naturalH
    );
    pdf.save(filename);
    return { pages: 1, fitted: false };
  }

  // Case 2 — slightly too tall: scale down so it still lands on one page.
  const fitScale = AVAIL_H / naturalH;
  if (fitScale >= MIN_FIT_SCALE) {
    const w = AVAIL_W * fitScale;
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.98),
      "JPEG",
      (PAGE_W - w) / 2, // keep it centred
      MARGIN,
      w,
      AVAIL_H
    );
    pdf.save(filename);
    return { pages: 1, fitted: true };
  }

  // Case 3 — genuinely long (lots of line items): slice into pages.
  const slicePx = Math.floor(canvas.width * (AVAIL_H / AVAIL_W));
  const slice = document.createElement("canvas");
  const ctx = slice.getContext("2d");
  let offset = 0;
  let pages = 0;

  while (offset < canvas.height) {
    const h = Math.min(slicePx, canvas.height - offset);
    slice.width = canvas.width;
    slice.height = h;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, offset, canvas.width, h, 0, 0, canvas.width, h);

    if (pages > 0) pdf.addPage();
    pdf.addImage(
      slice.toDataURL("image/jpeg", 0.98),
      "JPEG",
      MARGIN,
      MARGIN,
      AVAIL_W,
      (h / canvas.width) * AVAIL_W
    );

    offset += h;
    pages += 1;
  }

  pdf.save(filename);
  return { pages, fitted: false };
}