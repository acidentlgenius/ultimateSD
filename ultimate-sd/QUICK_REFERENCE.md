# Diagram Save/Load Quick Reference

## 🎯 Quick Start

### Save Your Diagram
1. Click **Save** button (toolbar)
2. File downloads as `system-diagram-[timestamp].sdd`

### Load a Diagram
1. Click **Load** button (toolbar)
2. Select `.sdd` file
3. Diagram appears instantly

## 📁 File Format

**Extension**: `.sdd` (System Design Diagram)  
**Type**: JSON  
**Size**: 1-15 KB typically

## 🔧 Keyboard Shortcuts

Currently none - feature request for future:
- `Cmd/Ctrl + S` - Save diagram
- `Cmd/Ctrl + O` - Open/Load diagram

## ✅ What Gets Saved

- ✅ All diagram elements (shapes, connectors, text)
- ✅ Element positions and sizes
- ✅ Text labels
- ✅ Colors
- ✅ Grid visibility setting
- ✅ Timestamp

## ❌ What Doesn't Get Saved

- ❌ Undo/redo history (starts fresh on load)
- ❌ Current selection (cleared on load)
- ❌ Zoom level (not yet implemented)
- ❌ Canvas scroll position

## 🎨 Use Cases

### 1. Save & Resume Later
```
Create diagram → Save → Close browser → Reopen → Load → Continue
```

### 2. Share with Team
```
Create diagram → Save → Send file → Teammate loads → Review/Edit
```

### 3. Create Templates
```
Design pattern → Save as template → Load for new projects → Customize
```

### 4. Version Control
```
Save v1 → Modify → Save v2 → Compare files → Choose version
```

## 🚨 Common Issues

### "Your diagram is empty!"
**Problem**: Trying to save with no elements  
**Solution**: Draw something first

### "Invalid file format!"
**Problem**: Selected wrong file type  
**Solution**: Only `.sdd` files work

### "Failed to load diagram!"
**Problem**: Corrupted or incompatible file  
**Solution**: Ensure file is valid `.sdd` from this app

### Can't find saved file
**Problem**: Don't know download location  
**Solution**: Check browser downloads folder

## 💡 Pro Tips

### Naming Convention
Use descriptive names:
- ✅ `youtube-video-streaming.sdd`
- ✅ `uber-ride-matching-v2.sdd`
- ❌ `diagram1.sdd`
- ❌ `untitled.sdd`

### Backup Strategy
1. Save after major changes
2. Keep multiple versions
3. Store in cloud (Drive, Dropbox, etc.)
4. Name with version numbers

### Template Library
Create your own library:
```
/templates
  ├── 3-tier-webapp.sdd
  ├── microservices-pattern.sdd
  ├── event-driven-system.sdd
  └── distributed-cache.sdd
```

## 📊 File Structure (Advanced)

```json
{
  "version": "1.0",
  "type": "system-design-diagram",
  "timestamp": "2025-11-17T12:00:00.000Z",
  "elements": [
    {
      "id": "unique-id",
      "type": "database|server|client|...",
      "x": 100,
      "y": 150,
      "width": 120,
      "height": 80,
      "text": "Label",
      "color": "#3b82f6"
    }
  ],
  "settings": {
    "showGrid": true
  }
}
```

## 🔄 Workflow Examples

### Interview Practice
1. Start problem
2. Design architecture
3. Save as `problem-name-attempt1.sdd`
4. Review with AI
5. Modify and save as `problem-name-final.sdd`

### Collaborative Design
1. Designer A: Create initial design → Save → Share
2. Designer B: Load → Review → Modify → Save as v2 → Share
3. Designer A: Load v2 → Approve → Save final

### Learning Patterns
1. Study architecture pattern
2. Recreate in canvas
3. Save as template
4. Use template for similar problems
5. Build pattern library

## 🎓 Learning Resources

- **DIAGRAM_STATE_FILE.md** - Complete documentation
- **examples/README.md** - Example files guide
- **examples/sample-diagram.sdd** - Working example

## 🔮 Coming Soon

- [ ] Auto-save every N minutes
- [ ] Drag-and-drop file loading
- [ ] Load recent files menu
- [ ] Warn before replacing diagram
- [ ] Export to other formats (SVG, PNG+metadata)
- [ ] Import from draw.io
- [ ] Keyboard shortcuts for save/load
- [ ] Cloud storage integration

## 📞 Support

### File Issues
Check JSON structure is valid:
1. Open `.sdd` file in text editor
2. Verify JSON syntax
3. Check `type` field = "system-design-diagram"
4. Ensure `elements` is array

### Feature Requests
Want new features? Consider:
- What problem does it solve?
- Is it common use case?
- How would UI work?
- File format changes needed?

## ⚡ Performance

- **Save**: Instant (<100ms)
- **Load**: Very fast (<200ms for typical diagrams)
- **File Size**: Small (1-15 KB)
- **Memory**: Negligible impact

## 🔒 Privacy & Security

- ✅ All local (no server upload)
- ✅ No tracking or analytics
- ✅ No personal data collected
- ✅ Files stay on your device
- ✅ Share only when you choose

## 🎉 Summary

**Save**: Create diagram → Click Save → File downloads  
**Load**: Click Load → Select `.sdd` file → Diagram appears  
**That's it!** Simple, fast, reliable.

---

**Pro Tip**: Save early, save often! Never lose your work. 💾✨
