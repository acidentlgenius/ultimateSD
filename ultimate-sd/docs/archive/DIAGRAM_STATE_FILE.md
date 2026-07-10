# Diagram State File Feature

## Overview
The DiagramCanvas component now supports saving and loading diagram states using `.sdd` (System Design Diagram) files. This allows users to:
- Save their work and continue later
- Share diagrams with others
- Create reusable templates
- Backup their designs

## File Format

### Extension
`.sdd` - System Design Diagram

### Structure
The file is a JSON document with the following structure:

```json
{
  "version": "1.0",
  "type": "system-design-diagram",
  "timestamp": "2025-11-17T10:30:00.000Z",
  "elements": [
    {
      "id": "1234567890",
      "type": "database",
      "x": 100,
      "y": 150,
      "width": 120,
      "height": 80,
      "text": "PostgreSQL",
      "color": "#3b82f6"
    },
    {
      "id": "1234567891",
      "type": "server",
      "x": 300,
      "y": 150,
      "width": 120,
      "height": 80,
      "text": "API Server",
      "color": "#3b82f6"
    },
    {
      "id": "1234567892",
      "type": "arrow",
      "x": 220,
      "y": 190,
      "width": 0,
      "height": 0,
      "endX": 300,
      "endY": 190,
      "color": "#3b82f6"
    }
  ],
  "settings": {
    "showGrid": true
  }
}
```

### Field Descriptions

#### Root Level
- `version` (string): Format version for compatibility (currently "1.0")
- `type` (string): Always "system-design-diagram" for validation
- `timestamp` (string): ISO 8601 timestamp of when the file was created
- `elements` (array): List of all diagram elements
- `settings` (object): Diagram canvas settings

#### Element Structure
Each element in the `elements` array contains:
- `id` (string): Unique identifier for the element
- `type` (string): Element type - one of:
  - Shapes: `rectangle`, `circle`
  - System components: `database`, `server`, `cloud`, `loadbalancer`, `cache`, `queue`, `client`, `api`, `microservice`, `cdn`
  - Connectors: `arrow`, `line`
  - Text: `text`
- `x` (number): X-coordinate position on canvas
- `y` (number): Y-coordinate position on canvas
- `width` (number): Width of the element (0 for lines/arrows)
- `height` (number): Height of the element (0 for lines/arrows)
- `text` (string, optional): Label text for the element
- `color` (string): Hex color code for the element
- `endX` (number, optional): End X-coordinate for lines/arrows
- `endY` (number, optional): End Y-coordinate for lines/arrows

#### Settings Structure
- `showGrid` (boolean): Whether the grid is visible on the canvas

## Usage

### Saving a Diagram

1. **Create your diagram** using the canvas tools
2. **Click the "Save" button** in the toolbar
3. **Choose a location** in the file dialog
4. The file will be saved as `system-diagram-[timestamp].sdd`

**Note**: If the canvas is empty, you'll see a warning that there's nothing to save.

#### Success Feedback
- Toast notification appears with: "Diagram saved successfully! (X elements)"
- File downloads automatically to your default downloads folder

### Loading a Diagram

1. **Click the "Load" button** in the toolbar
2. **Select a `.sdd` file** from your file system
3. The diagram will be loaded onto the canvas, replacing the current content

**Note**: Only `.sdd` files are accepted. Other file types will show an error.

#### Success Feedback
- Toast notification appears with: "Diagram loaded successfully! (X elements)"
- Canvas is populated with the loaded elements
- Grid setting is restored if saved in the file

#### Error Handling
The load function validates:
- File extension must be `.sdd`
- File must contain valid JSON
- JSON must have `type: "system-design-diagram"`
- Elements array must exist and be an array

If validation fails, an error toast appears with details.

## Features

### Auto-Save to LocalStorage
In addition to manual save/load, diagrams are automatically saved to localStorage per step:
- Saves every 1 second while editing
- Keyed by `diagram-{stepKey}`
- Persists across page refreshes
- Cleared when navigating away

### Version Compatibility
The `version` field allows future format changes while maintaining backward compatibility:
- Version 1.0: Current format
- Future versions can add new fields while still supporting v1.0 files

### Settings Preservation
Canvas settings are saved with the diagram:
- Grid visibility state
- Future: Could include zoom level, canvas size, theme, etc.

## Technical Implementation

### Save Function (`saveDiagramFile`)
```typescript
const saveDiagramFile = () => {
  // Validate elements exist
  if (elements.length === 0) {
    // Show warning toast
    return;
  }

  // Create data structure
  const diagramData = {
    version: '1.0',
    type: 'system-design-diagram',
    timestamp: new Date().toISOString(),
    elements: elements,
    settings: { showGrid: showGrid }
  };

  // Convert to JSON and download
  const dataStr = JSON.stringify(diagramData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `system-diagram-${Date.now()}.sdd`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  // Show success toast
};
```

### Load Function (`loadDiagramFile`)
```typescript
const loadDiagramFile = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file extension
  if (!file.name.endsWith('.sdd')) {
    // Show error toast
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const diagramData = JSON.parse(content);

      // Validate structure
      if (diagramData.type !== 'system-design-diagram' || 
          !Array.isArray(diagramData.elements)) {
        throw new Error('Invalid diagram file structure');
      }

      // Load elements and settings
      setElements(diagramData.elements);
      saveHistory(diagramData.elements);
      setSelectedElement(null);
      
      if (diagramData.settings?.showGrid !== undefined) {
        setShowGrid(diagramData.settings.showGrid);
      }
      
      // Show success toast
    } catch (error) {
      // Show error toast
    }
  };
  reader.readAsText(file);
  
  // Reset input for re-selection
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};
```

## UI Components

### Toolbar Buttons
Located in the toolbar after the Undo/Redo buttons:

```tsx
<Button onClick={saveDiagramFile} title="Save Diagram File (.sdd)">
  <Save className="h-4 w-4 mr-1" />
  Save
</Button>

<Button onClick={() => fileInputRef.current?.click()} 
        title="Load Diagram File (.sdd)">
  <Upload className="h-4 w-4 mr-1" />
  Load
</Button>
```

### Hidden File Input
```tsx
<input
  ref={fileInputRef}
  type="file"
  accept=".sdd"
  onChange={loadDiagramFile}
  className="hidden"
/>
```

## User Notifications

All operations provide visual feedback via toast notifications:

### Success Messages
- **Save**: "Diagram saved successfully! (X elements)"
- **Load**: "Diagram loaded successfully! (X elements)"

### Warning Messages
- **Empty Save**: "Your diagram is empty! Nothing to save."

### Error Messages
- **Invalid Extension**: "Invalid file format! Please select a .sdd file."
- **Invalid Content**: "Failed to load diagram! Invalid file format."

Toasts auto-dismiss after 3-4 seconds and appear in the bottom-right corner.

## Use Cases

### 1. Template Creation
Create reusable architecture templates:
```
1. Design a common architecture pattern (e.g., 3-tier web app)
2. Save as "template-3tier-webapp.sdd"
3. Load and customize for different projects
```

### 2. Collaborative Review
Share designs with team members:
```
1. Design your system architecture
2. Save as "proposal-payment-system.sdd"
3. Share file with team via email/Slack/Drive
4. Team loads and reviews/modifies
```

### 3. Version Control
Maintain design history:
```
1. Save initial design: "v1-initial-design.sdd"
2. Make changes
3. Save iterations: "v2-added-cache.sdd", "v3-final.sdd"
```

### 4. Practice Sessions
Save progress during interview practice:
```
1. Start practice problem
2. Design architecture
3. Save before taking a break
4. Resume later by loading the file
```

## Best Practices

1. **Naming Convention**: Use descriptive names
   - ✅ `youtube-streaming-architecture.sdd`
   - ❌ `diagram1.sdd`

2. **Regular Saves**: Save frequently during complex designs

3. **Version Control**: Use meaningful version identifiers
   - `design-v1-initial.sdd`
   - `design-v2-scalability.sdd`
   - `design-v3-final.sdd`

4. **Backup**: Keep copies of important designs in cloud storage

5. **Organization**: Create folders for different projects/systems

## Future Enhancements

Potential improvements for future versions:

1. **Export to Other Formats**
   - Export to draw.io XML
   - Export to PlantUML
   - Export to Mermaid diagram

2. **Metadata**
   - Author information
   - Description/notes
   - Tags/categories
   - Problem/requirement reference

3. **Advanced Settings**
   - Canvas size
   - Zoom level
   - Background color
   - Theme preference

4. **Compression**
   - Gzip compression for large diagrams
   - Base64 encoding for images (future feature)

5. **Cloud Sync**
   - Auto-save to cloud storage
   - Cross-device sync
   - Version history

6. **Import/Export**
   - Import from other tools (Lucidchart, Draw.io)
   - Export to image formats (automated)
   - Batch operations

## Troubleshooting

### "Invalid file format" error
**Cause**: File is corrupted or not a valid .sdd file  
**Solution**: Ensure you're loading a file that was saved by this application

### File won't load
**Cause**: JSON parsing error or missing required fields  
**Solution**: Open file in text editor and verify JSON structure matches format

### Elements appear incorrectly
**Cause**: Version mismatch or corrupted element data  
**Solution**: Check the `version` field and element structures

### Can't find saved file
**Cause**: Download location not known  
**Solution**: Check browser's default download folder

### Lost work after load
**Cause**: Loading replaces current canvas without warning  
**Solution**: Always save current work before loading a file (future: add warning dialog)

## File Size

Typical file sizes:
- Small diagram (5-10 elements): ~1-2 KB
- Medium diagram (20-30 elements): ~4-6 KB
- Large diagram (50+ elements): ~10-15 KB

The JSON format is human-readable and efficient for this use case.

## Security Considerations

1. **No Server Upload**: Files are saved/loaded locally only
2. **No Personal Data**: Files contain only diagram structure
3. **JSON Parsing**: Validated before loading to prevent injection
4. **Browser Sandbox**: File operations use standard browser APIs

## Conclusion

The diagram state file feature provides a robust way to persist and share system design diagrams. The `.sdd` format is simple, human-readable, and extensible for future enhancements while maintaining backward compatibility.
