/** Document Picture-in-Picture helpers (Chromium 116+). */

interface DocumentPiPOptions {
  width?: number;
  height?: number;
}
interface DocumentPiP {
  requestWindow(options?: DocumentPiPOptions): Promise<Window>;
  window: Window | null;
}
declare global {
  interface Window {
    documentPictureInPicture?: DocumentPiP;
  }
}

export function isPipSupported(): boolean {
  return typeof window !== 'undefined' && 'documentPictureInPicture' in window;
}

/** Open a PiP window and copy the host page's styles into it so Tailwind classes apply. */
export async function openPipWindow(width = 320, height = 200): Promise<Window | null> {
  if (!isPipSupported()) return null;
  const pip = await window.documentPictureInPicture!.requestWindow({ width, height });

  // Copy all <style> and <link rel=stylesheet> nodes from the host document.
  for (const node of Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]'),
  )) {
    pip.document.head.appendChild(node.cloneNode(true));
  }
  pip.document.body.style.margin = '0';
  pip.document.body.style.background = '#efece6';
  pip.document.body.style.color = '#1c1917';
  pip.document.body.style.fontFamily =
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  return pip;
}
