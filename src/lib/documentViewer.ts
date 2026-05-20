/**
 * Safe document viewing utility that translates base64/data URLs into same-origin Blob URLs.
 * This completely resolves browser security restrictions blocking top-level data URL navigation.
 */
export function getSafeDocumentUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:')) {
    try {
      const arr = url.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('[DocumentViewer] Error translating base64 to Blob URL:', e);
      return url;
    }
  }
  return url;
}

/**
 * Checks if a given URL is a base64 encoded document.
 */
export function isBase64Url(url: string): boolean {
  return typeof url === 'string' && url.startsWith('data:');
}

/**
 * Safe trigger to view or download a document.
 */
export function viewDocumentSecurely(url: string, fileName = 'documento') {
  if (!url) return;
  
  // Prioritize global in-app document viewer to prevent pop-up blocks and automatic downloads
  const globalPreview = (window as any).__showDocumentPreview;
  if (typeof globalPreview === 'function') {
    globalPreview(url, fileName);
    return;
  }
  
  const safeUrl = getSafeDocumentUrl(url);
  
  // Try to open in a new tab
  const newWindow = window.open(safeUrl, '_blank');
  
  // Fallback if pop-ups are blocked and preview function was not registered
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    const link = document.createElement('a');
    link.href = safeUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
