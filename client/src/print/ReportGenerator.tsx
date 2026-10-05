/**
 * نشان‌نما و توابع تولید فایل HTML برای چاپ حرفه‌ای
 * Professional Print HTML Generator
 * 
 * ویژگی‌های:
 * - طراحی حرفه‌ای و مطابق با برند
 * - ارسال فایل HTML مستقل
 * - پشتیبانی RTL و A4
 * - قابلیت چاپ برای تمام اپلیکیشن‌ها
 * - هدر/فوتر و شماره‌گذاری صفحات
 * - تنظیمات جلوه‌های بصری
 */

import React, { useCallback, useRef } from 'react';

// رنگ‌های برند
const BRAND_COLORS = {
  primary: '#284d49',
  secondary: '#315f57',
  accent: '#d9bb73',
  text: '#1b2638',
  textLight: '#68768a',
  border: '#e7eaf0',
  background: '#f7f8fc',
  success: '#41836e',
  danger: '#c06b69',
};

// تنظیمات صفحهٔ پرینت
const PRINT_CONFIG = {
  paperSize: 'A4',
  orientation: 'portrait', // یا landscape
  margin: { top: 15, right: 15, bottom: 15, left: 15 }, // میلی‌متر
  fontSize: 11,
  fontFamily: '"Vazirmatn", Tahoma, sans-serif',
};

/**
 * ساختار داده برای گزارش HTML
 */
interface ReportData {
  title: string;
  subtitle?: string;
  companyName?: string;
  companyLogo?: string;
  date?: string;
  sections: ReportSection[];
  footer?: string;
  showPageNumbers?: boolean;
  showTimestamp?: boolean;
}

interface ReportSection {
  title?: string;
  subtitle?: string;
  type: 'table' | 'paragraph' | 'summary' | 'divider' | 'image';
  data?: any;
  columns?: ReportColumn[];
  rows?: ReportRow[];
  content?: string;
  styling?: Record<string, any>;
}

interface ReportColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  private?: boolean;
  numeric?: boolean;
  format?: (value: any) => string;
}

interface ReportRow {
  [key: string]: any;
}

/**
 * تولید استایل‌های CSS برای چاپ
 */
const generatePrintStyles = (): string => `
<style>
  * {
    box-sizing: border-box;
  }
  
  html, body {
    margin: 0;
    padding: 0;
    background: white;
    color: #000;
    font-family: ${PRINT_CONFIG.fontFamily};
    direction: rtl;
    text-align: right;
    line-height: 1.6;
  }
  
  @page {
    size: ${PRINT_CONFIG.paperSize} ${PRINT_CONFIG.orientation};
    margin: ${PRINT_CONFIG.margin.top}mm ${PRINT_CONFIG.margin.right}mm ${PRINT_CONFIG.margin.bottom}mm ${PRINT_CONFIG.margin.left}mm;
    
    @bottom-right {
      content: "صفحهٔ " counter(page);
      font-size: 9px;
      color: #999;
    }
  }
  
  body {
    font-size: ${PRINT_CONFIG.fontSize}px;
    color: #1a1a1a;
  }
  
  .page-break {
    page-break-after: always;
    break-after: page;
  }
  
  .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  /* سرفصل و عنوان */
  .report-header {
    margin-bottom: 24px;
    text-align: center;
    border-bottom: 3px solid ${BRAND_COLORS.primary};
    padding-bottom: 12px;
  }
  
  .report-logo {
    max-width: 80px;
    max-height: 80px;
    margin-bottom: 12px;
  }
  
  .report-title {
    font-size: 20px;
    font-weight: bold;
    color: ${BRAND_COLORS.primary};
    margin: 0 0 6px 0;
  }
  
  .report-subtitle {
    font-size: 14px;
    color: ${BRAND_COLORS.textLight};
    margin: 0 0 6px 0;
  }
  
  .report-meta {
    font-size: 9px;
    color: #999;
    margin-top: 6px;
  }
  
  /* سرفصل بخش */
  .section-title {
    font-size: 14px;
    font-weight: bold;
    color: ${BRAND_COLORS.primary};
    margin: 18px 0 10px 0;
    page-break-after: avoid;
    border-right: 4px solid ${BRAND_COLORS.accent};
    padding-right: 8px;
  }
  
  .section-subtitle {
    font-size: 11px;
    color: ${BRAND_COLORS.textLight};
    margin: 0 0 8px 0;
    page-break-after: avoid;
  }
  
  /* جدول */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    page-break-inside: avoid;
  }
  
  thead {
    display: table-header-group;
  }
  
  th {
    background: ${BRAND_COLORS.primary};
    color: white;
    font-weight: 700;
    padding: 10px 8px;
    text-align: right;
    font-size: 10px;
    border: 1px solid ${BRAND_COLORS.primary};
  }
  
  td {
    padding: 8px;
    border: 1px solid #ddd;
    border-right: 1px solid ${BRAND_COLORS.border};
    text-align: right;
    font-size: ${PRINT_CONFIG.fontSize - 1}px;
  }
  
  tbody tr:nth-child(odd) {
    background: #fafafa;
  }
  
  tbody tr {
    page-break-inside: avoid;
  }
  
  /* ستون‌های خصوصی */
  .private {
    display: none !important;
  }
  
  /* اعداد */
  .numeric {
    font-family: "Courier New", monospace;
    text-align: left;
    font-weight: 600;
  }
  
  /* رنگ‌ها و وضعیت */
  .positive {
    color: ${BRAND_COLORS.success};
    font-weight: 600;
  }
  
  .negative {
    color: ${BRAND_COLORS.danger};
    font-weight: 600;
  }
  
  .status-active {
    color: ${BRAND_COLORS.success};
  }
  
  .status-pending {
    color: #f59e0b;
  }
  
  .status-closed {
    color: ${BRAND_COLORS.danger};
  }
  
  /* خلاصه و خانه‌های اطلاعات */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin: 12px 0;
    page-break-inside: avoid;
  }
  
  .summary-card {
    border: 1px solid ${BRAND_COLORS.border};
    padding: 12px;
    text-align: center;
    background: #fafafa;
  }
  
  .summary-label {
    font-size: 9px;
    color: ${BRAND_COLORS.textLight};
    margin-bottom: 4px;
  }
  
  .summary-value {
    font-size: 16px;
    font-weight: bold;
    color: ${BRAND_COLORS.primary};
    font-family: "Courier New", monospace;
  }
  
  /* خط جدا‌کننده */
  .divider {
    border-top: 2px solid ${BRAND_COLORS.border};
    margin: 16px 0;
    page-break-after: avoid;
  }
  
  /* متن و پاراگراف */
  p {
    margin: 8px 0;
    line-height: 1.6;
  }
  
  .paragraph-section {
    page-break-inside: avoid;
    margin-bottom: 12px;
  }
  
  /* فوتر */
  .report-footer {
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px solid ${BRAND_COLORS.border};
    font-size: 9px;
    color: #999;
    text-align: center;
  }
  
  .footer-note {
    margin-bottom: 6px;
  }
  
  /* حاشیه‌نویسی */
  .note {
    background: #f0f8f5;
    border-right: 3px solid ${BRAND_COLORS.success};
    padding: 8px;
    margin: 12px 0;
    font-size: 9px;
    color: #333;
    page-break-inside: avoid;
  }
  
  .warning {
    background: #fff8f0;
    border-right: 3px solid #f59e0b;
    padding: 8px;
    margin: 12px 0;
    font-size: 9px;
    color: #333;
    page-break-inside: avoid;
  }
  
  /* تنظیمات Landscape */
  @media (orientation: landscape) {
    table {
      font-size: 9px;
    }
    
    td, th {
      padding: 6px 4px;
    }
  }
</style>
`;

/**
 * تولید جدول HTML
 */
const generateTable = (section: ReportSection): string => {
  if (!section.rows || !section.columns) return '';
  
  const columns = section.columns || [];
  const rows = section.rows || [];
  
  let html = '<table>';
  
  // سرفصل
  html += '<thead><tr>';
  for (const col of columns) {
    if (!col.private) {
      html += `<th style="text-align: ${col.align || 'right'}" ${col.numeric ? 'class="numeric"' : ''}>${col.label}</th>`;
    }
  }
  html += '</tr></thead>';
  
  // ردیف‌ها
  html += '<tbody>';
  for (const row of rows) {
    html += '<tr>';
    for (const col of columns) {
      if (!col.private) {
        let value = row[col.key] || '';
        if (col.format) {
          value = col.format(value);
        }
        const className = col.numeric ? 'numeric' : '';
        html += `<td class="${className}" style="text-align: ${col.align || 'right'}">${value}</td>`;
      }
    }
    html += '</tr>';
  }
  html += '</tbody>';
  
  html += '</table>';
  return html;
};

/**
 * تولید HTML کامل گزارش
 */
export const generateReportHTML = (data: ReportData): string => {
  let html = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${data.title}</title>
  ${generatePrintStyles()}
</head>
<body>`;

  // سرفصل
  html += '<div class="report-header">';
  if (data.companyLogo) {
    html += `<img src="${data.companyLogo}" class="report-logo" alt="لوگو" />`;
  }
  if (data.companyName) {
    html += `<h2 style="font-size: 18px; margin: 0 0 8px 0; color: ${BRAND_COLORS.primary};">${data.companyName}</h2>`;
  }
  html += `<h1 class="report-title">${data.title}</h1>`;
  if (data.subtitle) {
    html += `<p class="report-subtitle">${data.subtitle}</p>`;
  }
  html += '<div class="report-meta">';
  if (data.showTimestamp) {
    html += `<span>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</span>`;
    html += ` | <span>وقت: ${new Date().toLocaleTimeString('fa-IR')}</span>`;
  }
  html += '</div>';
  html += '</div>';

  // بخش‌ها
  for (const section of data.sections) {
    html += '<div class="avoid-break">';
    
    if (section.title) {
      html += `<h2 class="section-title">${section.title}</h2>`;
    }
    if (section.subtitle) {
      html += `<p class="section-subtitle">${section.subtitle}</p>`;
    }

    if (section.type === 'table') {
      html += generateTable(section);
    } else if (section.type === 'paragraph') {
      html += `<div class="paragraph-section">${section.content || ''}</div>`;
    } else if (section.type === 'summary') {
      html += '<div class="summary-grid">';
      if (section.data) {
        for (const item of section.data) {
          html += `<div class="summary-card">
            <div class="summary-label">${item.label}</div>
            <div class="summary-value">${item.value}</div>
          </div>`;
        }
      }
      html += '</div>';
    } else if (section.type === 'divider') {
      html += '<div class="divider"></div>';
    }
    
    html += '</div>';
  }

  // فوتر
  if (data.footer || data.showPageNumbers) {
    html += '<div class="report-footer">';
    if (data.footer) {
      html += `<div class="footer-note">${data.footer}</div>`;
    }
    if (data.showPageNumbers) {
      html += `<div class="footer-note">تولید شده توسط حسابداری کارگاه</div>`;
    }
    html += '</div>';
  }

  html += `</body>
</html>`;

  return html;
};

/**
 * دانلود HTML به عنوان فایل
 */
export const downloadReportHTML = (
  html: string,
  filename: string = `report-${new Date().getTime()}.html`
): void => {
  const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * باز کردن HTML در تب جدید
 */
export const openReportInNewTab = (html: string): Window | null => {
  const newWindow = window.open();
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
    return newWindow;
  }
  return null;
};

/**
 * کامپوننت: دکمهٔ چاپ
 */
export interface PrintReportButtonProps {
  html: string;
  filename?: string;
  label?: string;
  className?: string;
  onPrint?: () => void;
  downloadOnly?: boolean;
}

export function PrintReportButton({
  html,
  filename,
  label = 'چاپ',
  className = '',
  onPrint,
  downloadOnly = false,
}: PrintReportButtonProps) {
  const handlePrint = () => {
    const newWindow = openReportInNewTab(html);
    if (newWindow && !downloadOnly) {
      setTimeout(() => {
        newWindow.print();
      }, 250);
    }
    onPrint?.();
  };

  const handleDownload = () => {
    downloadReportHTML(html, filename || 'گزارش.html');
    onPrint?.();
  };

  return (
    <div className={`print-actions ${className}`}>
      {!downloadOnly && (
        <button onClick={handlePrint} className="print-button">
          {label}
        </button>
      )}
      <button onClick={handleDownload} className="download-button">
        دانلود HTML
      </button>
    </div>
  );
}

/**
 * هوک برای استفاده آسان‌تر
 */
export function useReportGenerator() {
  const generateReport = useCallback((data: ReportData): string => {
    return generateReportHTML(data);
  }, []);

  const printReport = useCallback((data: ReportData) => {
    const html = generateReportHTML(data);
    openReportInNewTab(html);
  }, []);

  const downloadReport = useCallback(
    (data: ReportData, filename?: string) => {
      const html = generateReportHTML(data);
      downloadReportHTML(html, filename);
    },
    []
  );

  const printAndDownload = useCallback((data: ReportData, filename?: string) => {
    const html = generateReportHTML(data);
    const newWindow = openReportInNewTab(html);
    setTimeout(() => {
      newWindow?.print();
    }, 250);
    setTimeout(() => {
      downloadReportHTML(html, filename);
    }, 500);
  }, []);

  return {
    generateReport,
    printReport,
    downloadReport,
    printAndDownload,
  };
}
