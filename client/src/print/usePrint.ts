/**
 * هوک چاپ بهینه‌شدهٔ HTML
 * Optimized HTML Print Hook
 * 
 * قابلیت‌های:
 * - چاپ مستقیم window.print()
 * - تولید HTML قابل چاپ
 * - پیش‌نمایش چاپ
 * - صادرات PDF
 * - تنظیمات صفحه و حاشیه
 */

import { useCallback, useRef } from 'react';

interface PrintOptions {
  title?: string; // عنوان چاپ
  orientation?: 'portrait' | 'landscape'; // جهت
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  }; // حاشیه (میلی‌متر)
  includeStylesheet?: boolean; // شامل CSS چاپ
  printableSelector?: string; // انتخابگر عنصر قابل چاپ
  hideSelectors?: string[]; // انتخابگرهای مخفی‌کننده
  showSelectors?: string[]; // انتخابگرهای نمایشی
  paperSize?: 'A4' | 'A3' | 'Letter' | 'Legal'; // اندازهٔ کاغذ
  scale?: number; // مقیاس (0.5 تا 1.0)
  delay?: number; // تاخیر قبل از چاپ (ms)
  onBeforePrint?: () => void; // قبل از چاپ
  onAfterPrint?: () => void; // بعد از چاپ
}

export function usePrint() {
  const printWindow = useRef<Window | null>(null);
  const printStyles = useRef<string>('');

  /**
   * بارگذاری استایل‌های چاپ
   */
  const loadPrintStyles = useCallback(async () => {
    if (printStyles.current) return printStyles.current;

    try {
      const response = await fetch('/print-styles.css');
      printStyles.current = await response.text();
    } catch (error) {
      console.warn('Failed to load print styles:', error);
    }

    return printStyles.current;
  }, []);

  /**
   * تبدیل تنظیمات حاشیه
   */
  const formatMargin = (margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  }): string => {
    const top = margin?.top ?? 15;
    const right = margin?.right ?? 15;
    const bottom = margin?.bottom ?? 15;
    const left = margin?.left ?? 15;
    return `${top}mm ${right}mm ${bottom}mm ${left}mm`;
  };

  /**
   * تولید HTML قابل چاپ
   */
  const generatePrintHTML = useCallback(
    async (
      element: HTMLElement,
      options: PrintOptions = {}
    ): Promise<string> => {
      const {
        title = 'چاپ',
        orientation = 'portrait',
        margin,
        includeStylesheet = true,
        hideSelectors = [],
        showSelectors = [],
        paperSize = 'A4',
        scale = 1,
      } = options;

      // بارگذاری استایل‌های چاپ
      const styles = await loadPrintStyles();

      // کپی عنصر
      const clone = element.cloneNode(true) as HTMLElement;

      // مخفی کردن عناصر
      hideSelectors.forEach((selector) => {
        clone.querySelectorAll(selector).forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      });

      // نمایش عناصر
      showSelectors.forEach((selector) => {
        clone.querySelectorAll(selector).forEach((el) => {
          (el as HTMLElement).style.display = '';
        });
      });

      // ساخت صفحهٔ HTML
      const html = `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    @page {
      size: ${paperSize} ${orientation};
      margin: ${formatMargin(margin)};
    }
    
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: white;
      color: #000;
      font-family: "Vazirmatn", Tahoma, sans-serif;
      direction: rtl;
      line-height: 1.5;
    }
    
    ${styles}
    
    body {
      transform: scale(${scale});
      transform-origin: top right;
    }
  </style>
</head>
<body>
  <div class="print-container">
    ${clone.innerHTML}
  </div>
</body>
</html>
      `;

      return html;
    },
    [loadPrintStyles]
  );

  /**
   * چاپ مستقیم (Window.print)
   */
  const print = useCallback(
    async (
      element: HTMLElement,
      options: PrintOptions = {}
    ): Promise<void> => {
      const { delay = 100, onBeforePrint, onAfterPrint } = options;

      onBeforePrint?.();

      // اضافهٔ کلاس چاپ
      element.classList.add('print-mode');

      // تأخیر برای rendering
      setTimeout(() => {
        window.print();

        // حذف کلاس چاپ
        element.classList.remove('print-mode');

        onAfterPrint?.();
      }, delay);
    },
    []
  );

  /**
   * باز کردن چاپ در پنجرهٔ جدید
   */
  const printInNewWindow = useCallback(
    async (
      element: HTMLElement,
      options: PrintOptions = {}
    ): Promise<Window | null> => {
      const { title = 'چاپ', delay = 100, onBeforePrint, onAfterPrint } = options;

      onBeforePrint?.();

      // تولید HTML
      const html = await generatePrintHTML(element, options);

      // باز کردن پنجرهٔ جدید
      printWindow.current = window.open('', title, 'width=1000,height=800');

      if (printWindow.current) {
        printWindow.current.document.write(html);
        printWindow.current.document.close();

        // انتظار برای بارگذاری و سپس چاپ
        setTimeout(() => {
          printWindow.current?.print();
          onAfterPrint?.();
        }, delay);
      } else {
        console.error('Failed to open print window');
      }

      return printWindow.current;
    },
    [generatePrintHTML]
  );

  /**
   * صادرات HTML برای ذخیره
   */
  const exportHTML = useCallback(
    async (
      element: HTMLElement,
      filename: string = 'document.html',
      options: PrintOptions = {}
    ): Promise<void> => {
      const html = await generatePrintHTML(element, options);

      // ایجاد Blob
      const blob = new Blob([html], { type: 'text/html; charset=utf-8' });

      // دانلود
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      // تمیز‌کاری
      URL.revokeObjectURL(link.href);
    },
    [generatePrintHTML]
  );

  /**
   * صادرات PDF (نیاز به pdf-lib یا مشابه)
   */
  const exportPDF = useCallback(
    async (
      element: HTMLElement,
      filename: string = 'document.pdf',
      options: PrintOptions = {}
    ): Promise<void> => {
      try {
        // بررسی دسترسی به window.print() برای PDF
        const html = await generatePrintHTML(element, options);

        // ایجاد iframe برای rendering
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.srcdoc = html;

        document.body.appendChild(iframe);

        // صبر برای بارگذاری
        await new Promise((resolve) => {
          iframe.onload = resolve;
        });

        // استفاده از window.print() برای PDF
        iframe.contentWindow?.print();

        // تمیز‌کاری
        document.body.removeChild(iframe);
      } catch (error) {
        console.error('PDF export failed:', error);
        // Fallback به HTML export
        await exportHTML(element, filename, options);
      }
    },
    [generatePrintHTML, exportHTML]
  );

  /**
   * چاپ طومار (Landscape)
   */
  const printLandscape = useCallback(
    async (element: HTMLElement, options: PrintOptions = {}): Promise<void> => {
      await print(element, { ...options, orientation: 'landscape' });
    },
    [print]
  );

  /**
   * چاپ عمودی (Portrait)
   */
  const printPortrait = useCallback(
    async (element: HTMLElement, options: PrintOptions = {}): Promise<void> => {
      await print(element, { ...options, orientation: 'portrait' });
    },
    [print]
  );

  /**
   * بسته تمام توابع
   */
  return {
    print,
    printInNewWindow,
    printLandscape,
    printPortrait,
    exportHTML,
    exportPDF,
    generatePrintHTML,
    loadPrintStyles,
  };
}

/**
 * کامپوننت کمکی: دکمهٔ چاپ
 */
export interface PrintButtonProps {
  element: HTMLElement | null;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  label?: string;
  className?: string;
  onPrint?: () => void;
}

export function PrintButton({
  element,
  title,
  orientation,
  label = 'چاپ',
  className = '',
  onPrint,
}: PrintButtonProps) {
  const { print } = usePrint();

  const handlePrint = async () => {
    if (element) {
      await print(element, { title, orientation });
      onPrint?.();
    }
  };

  return (
    <button
      onClick={handlePrint}
      className={`print-button ${className}`}
      title="چاپ این صفحه"
    >
      {label}
    </button>
  );
}
