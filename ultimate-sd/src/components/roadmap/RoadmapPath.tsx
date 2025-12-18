'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function RoadmapPath() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

    return (
        <div ref={ref} className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 z-0 hidden md:block pointer-events-none">
            {/* Background Line */}
            <div className="absolute inset-0 bg-border/20 w-px mx-auto" />

            {/* Animated Fill Line */}
            <motion.div
                style={{ scaleY: pathLength, transformOrigin: 'top' }}
                className="absolute inset-0 bg-gradient-to-b from-primary via-purple-500 to-blue-500 w-[2px] mx-auto shadow-[0_0_10px_rgba(var(--primary),0.5)]"
            />
        </div>
    );
}
