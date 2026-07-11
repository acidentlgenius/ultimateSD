---
name: tech-contenteditable
description: ContentEditable is used for canvas text areas — not controlled React inputs
metadata:
  type: feedback
---

# ContentEditable Pattern for Canvas Regions

## Rule
Canvas editable areas use `contentEditable="true"` with `onBlur` to save state — NOT React controlled inputs (`value`, `onChange`).

**Why:** Controlled inputs cause layout jank and re-render issues inside CSS-transformed canvases. More importantly, controlled inputs lose cursor position on every keystroke. ContentEditable preserves the natural browser text editing experience and works with the Caveat handwriting font.

## How to Apply

```tsx
// Correct pattern
const areaRef = useRef<HTMLDivElement>(null);

// Load initial content only once
useEffect(() => {
  if (areaRef.current && initialValue) {
    areaRef.current.textContent = initialValue;
  }
}, []); // empty deps — load once

// Save on blur
const handleBlur = () => {
  const text = areaRef.current?.textContent ?? '';
  onSave(text); // persist to useCanvasContent
};

return (
  <div
    ref={areaRef}
    contentEditable
    suppressContentEditableWarning
    onBlur={handleBlur}
    style={{ fontFamily: 'Caveat, cursive' }}
  />
);
```

## Key Gotchas

1. **`suppressContentEditableWarning`** is required or React will log warnings every render
2. **Never put a controlled `value` prop** on a contentEditable div — React will fight the DOM
3. **Initial content via `useEffect`**: don't put the initial text in JSX — React re-renders will fight the user's edits
4. **`visibility: hidden` not unmounting**: when a region is not yet reached, use `visibility: hidden` (CSS) not conditional rendering — this preserves the DOM node and the contentEditable state. If you unmount and remount, the user's edits are lost.
5. **Font rendering**: Caveat requires `font-size >= 18px` to look right on canvas; below that it reverts to system font appearance
6. **Placeholder text**: implement as CSS `::before` pseudo-element with `content: attr(data-placeholder)` shown when empty, not as actual DOM content

## Placeholder CSS Pattern

```css
.canvas-area[contenteditable]:empty::before {
  content: attr(data-placeholder);
  color: rgba(255, 255, 255, 0.3);
  pointer-events: none;
}
```

```tsx
<div
  data-placeholder="What are the functional requirements?"
  contentEditable
  suppressContentEditableWarning
  // ...
/>
```
