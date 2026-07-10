# Free Drawing Canvas Feature

## Overview
The Free Drawing Canvas is a standalone feature that allows users to create custom High-Level Design (HLD) or Low-Level Design (LLD) diagrams without being tied to any specific practice problem. This is perfect for:
- Planning your own system designs
- Practicing diagram creation
- Creating visual aids for explanations
- Preparing for interviews

## How to Access

### From Home Page
1. Click the **"Free Draw"** button in the header (top right)
2. Or click the large feature banner card showcasing the Free Drawing Canvas

### Direct URL
Navigate to: `http://localhost:3000/draw`

## Features

### 1. **Diagram Type Selection**
When you first visit the page, you'll be prompted to choose:
- **High-Level Design (HLD)**: For system architecture diagrams
  - System components & services
  - Data flow & communication  
  - Infrastructure layout
  
- **Low-Level Design (LLD)**: For detailed component diagrams
  - Classes & interfaces
  - Methods & data structures
  - Detailed relationships

### 2. **Full Drawing Tools**
The canvas includes all the same tools available in practice mode:

#### Basic Shapes
- Rectangle - Generic components
- Circle - Process/node representation
- **Text - Labels and annotations** ✨
  - **Click to place** text on canvas
  - **Drag to move** text anywhere
  - **Double-click to edit** text content
  - Auto-adjusts width based on text length
- Arrow - Data flow direction
- Line - Connections between components

#### System Design Components
- **Load Balancer** (Gauge icon) - Traffic distribution
- **Cache** (Lightning bolt) - Redis/Memcached
- **Message Queue** (Binary icon) - Kafka/RabbitMQ/SQS
- **Client** (Users icon) - User/Mobile/Web apps
- **API Gateway** (Cable icon) - REST/GraphQL endpoints
- **Microservice** (Box icon) - Service components
- **CDN** (HardDrive icon) - Content delivery network
- **Database** (Database icon) - SQL/NoSQL storage
- **Server** (Server icon) - Application servers
- **Cloud** (Cloud icon) - Cloud services/infrastructure

#### Canvas Controls
- **Select & Move** (V key) - Select and reposition elements
  - Click to select any element
  - Drag to move selected elements
  - **Double-click to edit text or labels** ✨
- **Undo/Redo** (Cmd+Z / Cmd+Shift+Z) - Step backward/forward
- **Grid Toggle** - Show/hide alignment grid
- **Add Label** - Add text labels to selected components
- **Delete** (Del key) - Remove selected elements
- **Clear All** - Reset the entire canvas

### 3. **Export Functionality** ✨
- **Smart Cropping**: Automatically crops to only the area where your drawing exists
- **No Empty Space**: Exported images contain only your diagram with minimal padding (40px)
- **Optimized File Size**: Smaller, cleaner images compared to full canvas export
- **Download PNG**: Export your diagram as a high-quality PNG image
- **Success Notification**: Shows actual dimensions of exported image
- Files are automatically named with timestamps:
  - HLD diagrams: `hld-diagram-YYYY-MM-DD-HH-MM-SS.png`
  - LLD diagrams: `lld-diagram-YYYY-MM-DD-HH-MM-SS.png`
- Exported images have a clean white background (grid is not included)

### 4. **Fullscreen Mode** 🆕
- **Distraction-Free Drawing**: Enter fullscreen mode for maximum focus
- **Minimal UI**: Only essential tools and controls are visible
- **Quick Access**: Click "Fullscreen Mode" button or "Fullscreen" in header
- **Easy Exit**: 
  - Press `ESC` key to exit fullscreen
  - Click "Exit Fullscreen" button
- **All Tools Available**: Full toolbar and functionality in fullscreen
- **Export in Fullscreen**: Download your diagram without exiting fullscreen

### 5. **Switch Diagram Type**
- Click the "Switch Type" button to change between HLD and LLD
- Warning: This will clear the current canvas, so you'll be prompted to confirm

## Usage Tips

1. **Start with Type Selection**: Choose HLD or LLD based on your needs
2. **Use Fullscreen Mode**: Enter fullscreen for maximum focus and minimal distractions
3. **Use the Grid**: Toggle grid on for easier alignment of components
4. **Label Everything**: Select components and add labels for clarity
5. **Edit Text Easily**: Double-click any text element or labeled component to edit ✨
6. **Arrows for Flow**: Use arrows to show data flow and dependencies
7. **Smart Export**: The export automatically crops to your diagram - no need to worry about canvas size!
8. **Save Regularly**: Export your diagram periodically to avoid losing work
9. **Select Mode**: Always return to Select mode (Move icon) when done drawing
10. **ESC to Exit**: Press ESC key anytime to exit fullscreen mode

## Keyboard Shortcuts

- **V** - Select & Move tool
- **R** - Rectangle tool
- **C** - Circle tool
- **D** - Database tool
- **S** - Server tool
- **A** - Arrow tool
- **L** - Line tool
- **T** - Text tool
- **Cmd+Z** - Undo
- **Cmd+Shift+Z** - Redo
- **Del** - Delete selected element
- **ESC** - Exit fullscreen mode

## Technical Details

### Implementation
- **Page**: `/src/app/draw/page.tsx` - Main drawing page component
- **Canvas**: Uses the same `DiagramCanvas` component as practice mode
- **Export**: Client-side canvas to PNG conversion
- **Storage**: Each diagram type has its own localStorage key for session persistence

### Canvas Specifications
- Canvas Size: 2000x1200 pixels
- Grid Size: 20px spacing
- Export Format: PNG (transparent background optional)
- Component Library: 15+ pre-built system design shapes

## Examples

### High-Level Design Use Cases
- Design a URL shortener (TinyURL)
- Design a video streaming service (YouTube)
- Design a social media feed (Twitter)
- Design a ride-sharing system (Uber)
- Design a distributed cache system

### Low-Level Design Use Cases
- Design a parking lot system classes
- Design an elevator control system
- Design a chess game structure
- Design an inventory management system
- Design a notification service

## Notes

- Diagrams are not saved to the server (session-only)
- Each diagram type (HLD/LLD) maintains its own canvas state
- Switching between types will clear the current canvas
- All features work offline after initial page load
- No authentication required - fully public and free

## Future Enhancements

Potential improvements for future versions:
- SVG export in addition to PNG
- Save diagrams to account (when auth is added)
- Share diagrams via URL
- Template library for common patterns
- Collaboration features
- AI suggestions for architecture patterns

---

**Enjoy creating your system design diagrams! 🎨**
