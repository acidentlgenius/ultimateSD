/**
 * Utility functions for exporting diagrams.
 */

export interface ExportOptions {
  diagramType?: string | null;
  toastZIndex?: string; // e.g. "z-50" or "z-[60]"
  toastDuration?: number; // ms to keep toast visible before fading
  useLongTimestamp?: boolean; // If true, uses ISO with time instead of Date.now()
}

export const exportPNG = (options: ExportOptions = {}) => {
  // Safe document check
  if (typeof document === 'undefined') return;

  const {
    diagramType,
    toastZIndex = "z-50",
    toastDuration = 3000,
    useLongTimestamp = false
  } = options;

  const canvas = document.querySelector('canvas');
  if (!canvas) {
    alert('❌ No diagram found. Please draw something first!');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Get bounding box of all elements for smart cropping
  const getBoundingBox = (window as any).sd_getBoundingBox;
  const elements = (window as any).sd_getDiagramElements?.();

  if (!getBoundingBox || !elements || elements.length === 0) {
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
    return;
  }

  const bounds = getBoundingBox();
  const cropWidth = Math.ceil(bounds.maxX - bounds.minX);
  const cropHeight = Math.ceil(bounds.maxY - bounds.minY);

  // Create a temporary canvas with the cropped size
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = cropWidth;
  tempCanvas.height = cropHeight;
  const tempCtx = tempCanvas.getContext('2d');

  if (tempCtx) {
    // Fill with white background
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, cropWidth, cropHeight);

    // Copy only the relevant portion of the canvas (cropped to content)
    tempCtx.drawImage(
      canvas,
      bounds.minX, bounds.minY, cropWidth, cropHeight, // Source rectangle
      0, 0, cropWidth, cropHeight // Destination rectangle
    );

    // Generate filename
    const link = document.createElement('a');
    let fileName = '';

    if (useLongTimestamp) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      fileName = diagramType
        ? `${diagramType.toLowerCase()}-diagram-${timestamp}.png`
        : `diagram-${timestamp}.png`;
    } else {
      const getDesignName = (window as any).sd_getDesignName;
      const currentDesignName = getDesignName ? getDesignName() : 'system-diagram';
      const cleanName = currentDesignName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      fileName = `${cleanName}-${Date.now()}.png`;
    }

    link.download = fileName;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();

    // Show success feedback with dimensions
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
                <div class="text-sm opacity-90">Size: ${cropWidth}×${cropHeight}px • ${diagramType} format</div>
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
          <span>Diagram exported! (${cropWidth}×${cropHeight}px)</span>
        </div>
      `;
    }
    document.body.appendChild(toast);

    // Fade out and remove
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
  }
};
