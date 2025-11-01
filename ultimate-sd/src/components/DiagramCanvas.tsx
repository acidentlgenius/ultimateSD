'use client';

import dynamic from 'next/dynamic';

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(() => import('@excalidraw/excalidraw').then(mod => ({ default: mod.Excalidraw })), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-gray-500">Loading diagram editor...</div>
});

export default function DiagramCanvas() {
  const handleShareWithAI = () => {
    alert('Diagram sharing with AI will be implemented soon!');
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-black">System Diagram</h3>
        <button
          onClick={handleShareWithAI}
          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
        >
          Share with AI
        </button>
      </div>
      <div className="flex-1 p-4">
        <div style={{ height: '100%', minHeight: '400px' }}>
          <Excalidraw
            theme="light"
            initialData={{
              appState: {
                viewBackgroundColor: '#ffffff',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}