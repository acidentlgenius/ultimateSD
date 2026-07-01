/**
 * Utility functions for exporting diagrams.
 */

export interface ExportOptions {
  diagramType?: string | null;
  toastZIndex?: string;
  toastDuration?: number;
  useLongTimestamp?: boolean;
  getPngBlob?: () => Promise<Blob | null>;
}

function showEmptyDiagramToast(toastZIndex: string) {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 ${toastZIndex} bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in`;
  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Your diagram is empty! Please add some components first.</span>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

export const exportPNG = async (options: ExportOptions = {}) => {
  if (typeof document === 'undefined') return;

  const {
    diagramType,
    toastZIndex = 'z-50',
    toastDuration = 3000,
    useLongTimestamp = false,
    getPngBlob,
  } = options;

  if (!getPngBlob) {
    showEmptyDiagramToast(toastZIndex);
    return;
  }

  const blob = await getPngBlob();
  if (!blob) {
    showEmptyDiagramToast(toastZIndex);
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  if (useLongTimestamp) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = diagramType
      ? `${diagramType.toLowerCase()}-diagram-${timestamp}.png`
      : `diagram-${timestamp}.png`;
  } else {
    link.download = `diagram-${Date.now()}.png`;
  }

  link.href = url;
  link.click();
  URL.revokeObjectURL(url);

  const toast = document.createElement('div');
  if (diagramType) {
    toast.className = `fixed bottom-4 right-4 ${toastZIndex} bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl animate-fade-in border-2 border-green-400`;
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-full bg-white/20">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <div class="font-semibold">Diagram exported successfully!</div>
          <div class="text-sm opacity-90">${diagramType} format</div>
        </div>
      </div>
    `;
  } else {
    toast.className = `fixed bottom-4 right-4 ${toastZIndex} bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in flex flex-col gap-1`;
    toast.innerHTML = `
      <div class="flex items-center gap-2 font-medium">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Diagram exported!</span>
      </div>
    `;
  }
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    if (diagramType) {
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.3s ease-out';
    } else {
      toast.style.transition = 'opacity 0.5s ease';
    }
    setTimeout(() => toast.remove(), 500);
  }, toastDuration);
};
