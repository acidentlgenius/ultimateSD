"use client";

import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({
    startOnLoad: true,
    theme: "dark",
    securityLevel: "loose",
});

interface MermaidDiagramProps {
    chart: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.innerHTML = `<div class="mermaid">${chart}</div>`;
            mermaid.contentLoaded();
        }
    }, [chart]);

    return <div ref={containerRef} className="w-full flex justify-center py-4 bg-muted/20 rounded-lg overflow-hidden" />;
};
