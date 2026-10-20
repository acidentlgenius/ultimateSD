import os

src_file = "ultimate-sd/src/components/landing/AdaptiveCoachDemo.tsx"
with open(src_file, 'r') as f:
    src_content = f.read()

# Replace useRef with useState
src_content = src_content.replace(
    "const preferReducedMotion = useRef(false);",
    "const [preferReducedMotion, setPreferReducedMotion] = useState(false);"
)

# Update useEffect setting preferReducedMotion
old_effect_1 = """  useEffect(() => {
    preferReducedMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);"""

new_effect_1 = """  useEffect(() => {
    setPreferReducedMotion(
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);"""
src_content = src_content.replace(old_effect_1, new_effect_1)

# Update useEffect using preferReducedMotion.current
old_effect_2 = """  useEffect(() => {
    setElapsedMs(preferReducedMotion.current ? durationMs : 0);
    setPlaying(!preferReducedMotion.current);
  }, [level, replayKey, durationMs]);"""

new_effect_2 = """  useEffect(() => {
    setElapsedMs(preferReducedMotion ? durationMs : 0);
    setPlaying(!preferReducedMotion);
  }, [level, replayKey, durationMs, preferReducedMotion]);"""
src_content = src_content.replace(old_effect_2, new_effect_2)

# Update shown logic
old_shown = """  const shown = preferReducedMotion.current
    ? script
    : visibleBeats(script, elapsedMs);"""

new_shown = """  const shown = preferReducedMotion
    ? script
    : visibleBeats(script, elapsedMs);"""
src_content = src_content.replace(old_shown, new_shown)

# Update motion.div initial prop
old_initial = "initial={preferReducedMotion.current ? false : { opacity: 0, y: 10 }}"
new_initial = "initial={preferReducedMotion ? false : { opacity: 0, y: 10 }}"
src_content = src_content.replace(old_initial, new_initial)

with open(src_file, 'w') as f:
    f.write(src_content)
