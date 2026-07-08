import { jsPDF } from "jspdf";
import type { AppLanguage } from "@/lib/settings/preferences-storage";
import type { Supplier } from "@/types/database";

interface ExportProjectSuppliersPdfParams {
  language: AppLanguage;
  projectName: string;
  projectCode: string;
  suppliers: Supplier[];
}

function safeText(value: string | null): string {
  if (!value) {
    return "-";
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "-";
}

function normalizeFilename(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized.length > 0 ? normalized : "project";
}

export function exportProjectSuppliersPdf({
  language,
  projectName,
  projectCode,
  suppliers,
}: ExportProjectSuppliersPdfParams): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 48;
  const marginY = 52;
  const lineGap = 16;
  const maxContentWidth = pageWidth - marginX * 2;
  const header = language === "it" ? "Elenco fornitori progetto" : "Project suppliers list";
  const projectLabel = language === "it" ? "Progetto" : "Project";
  const countLabel = language === "it" ? "Fornitori" : "Suppliers";
  const companyLabel = language === "it" ? "Azienda" : "Company";
  const contactLabel = language === "it" ? "Referente" : "Contact";
  const emailLabel = "Email";
  const phoneLabel = language === "it" ? "Telefono" : "Phone";
  const websiteLabel = language === "it" ? "Sito web" : "Website";
  const categoriesLabel = language === "it" ? "Categorie" : "Categories";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(header, marginX, marginY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const projectValue = `${projectCode} - ${projectName}`;
  doc.text(`${projectLabel}: ${projectValue}`, marginX, marginY + 24);
  doc.text(`${countLabel}: ${suppliers.length}`, marginX, marginY + 40);

  let y = marginY + 68;

  suppliers.forEach((supplier, index) => {
    const categories =
      supplier.company_types.length > 0 ? supplier.company_types.join(", ") : "-";
    const entries = [
      `${companyLabel}: ${safeText(supplier.company)}`,
      `${contactLabel}: ${safeText(supplier.contact_name)}`,
      `${emailLabel}: ${safeText(supplier.email)}`,
      `${phoneLabel}: ${safeText(supplier.phone)}`,
      `${websiteLabel}: ${safeText(supplier.website)}`,
      `${categoriesLabel}: ${categories}`,
    ];

    const wrappedEntries = entries.flatMap((line) =>
      doc.splitTextToSize(line, maxContentWidth) as string[]
    );

    const blockHeight = wrappedEntries.length * lineGap + 10;
    const spaceRequired = blockHeight + 20;

    if (y + spaceRequired > doc.internal.pageSize.getHeight() - marginY) {
      doc.addPage();
      y = marginY;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`#${index + 1}`, marginX, y);
    y += lineGap;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    wrappedEntries.forEach((line) => {
      doc.text(line, marginX, y);
      y += lineGap;
    });

    y += 10;
    doc.setDrawColor(220);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 10;
  });

  const filename = `${normalizeFilename(projectCode)}-${normalizeFilename(projectName)}-suppliers.pdf`;
  doc.save(filename);
}
