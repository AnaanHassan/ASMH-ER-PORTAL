import {
  Header,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
} from "docx";
import fs from "fs";
import path from "path";

export function createLetterheadHeader(subtitle: string) {
  const logoPath = path.join(process.cwd(), "public/images/hospital-logo.jpg");
  const logoBuffer = fs.readFileSync(logoPath);

  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: "jpg",
            data: logoBuffer,
            transformation: { width: 500, height: 80 },
            altText: {
              title: "AMSH Logo",
              description: "Dr. Abdul Samad Memorial Hospital Logo",
              name: "hospital-logo",
            },
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: "DEPARTMENT OF EMERGENCY AND TRAUMA",
            bold: true,
            size: 20,
            font: "Arial",
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: subtitle,
            bold: true,
            size: 24,
            font: "Arial",
          }),
        ],
      }),
    ],
  });
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export function formatTime(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "";
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function textRun(
  text: string,
  options?: { bold?: boolean; size?: number }
): TextRun {
  return new TextRun({
    text,
    font: "Arial",
    size: options?.size ?? 20,
    bold: options?.bold ?? false,
  });
}

export function labelValue(
  label: string,
  value: string | number | null | undefined
): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      textRun(`${label}: `, { bold: true }),
      textRun(String(value ?? "")),
    ],
  });
}
