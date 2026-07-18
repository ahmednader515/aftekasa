/** حدود رفع الملفات — مصدر واحد للـ API والنصوص في الواجهة */

export const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_MESSAGE_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

export const MAX_PDF_MB = Math.round(MAX_PDF_BYTES / (1024 * 1024));
export const MAX_IMAGE_MB = Math.round(MAX_IMAGE_BYTES / (1024 * 1024));
export const MAX_MESSAGE_FILE_MB = Math.round(MAX_MESSAGE_FILE_BYTES / (1024 * 1024));
