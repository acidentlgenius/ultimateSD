with open("src/components/landing/AdaptiveCoachDemo.tsx", "r") as f:
    content = f.read()

content = content.replace(
    """  const preferReducedMotion = useRef(false);

  const script = useMemo(() => getDemoScript(level), [level]);""",
    """  const [preferReducedMotion, setPreferReducedMotion] = useState(false);

  const script = useMemo(() => getDemoScript(level), [level]);"""
)

content = content.replace(
    """  useEffect(() => {
    preferReducedMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);""",
    """  useEffect(() => {
    setPreferReducedMotion(
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);"""
)

content = content.replace(
    """  // Restart clock when level or replay changes
  useEffect(() => {
    setElapsedMs(preferReducedMotion.current ? durationMs : 0);
    setPlaying(!preferReducedMotion.current);
  }, [level, replayKey, durationMs]);""",
    """  // Restart clock when level or replay changes
  useEffect(() => {
    setElapsedMs(preferReducedMotion ? durationMs : 0);
    setPlaying(!preferReducedMotion);
  }, [level, replayKey, durationMs, preferReducedMotion]);"""
)

content = content.replace(
    """  const shown = preferReducedMotion.current
    ? script
    : visibleBeats(script, elapsedMs);""",
    """  const shown = preferReducedMotion
    ? script
    : visibleBeats(script, elapsedMs);"""
)

content = content.replace(
    """                initial={preferReducedMotion.current ? false : { opacity: 0, y: 10 }}""",
    """                initial={preferReducedMotion ? false : { opacity: 0, y: 10 }}"""
)


with open("src/components/landing/AdaptiveCoachDemo.tsx", "w") as f:
    f.write(content)
