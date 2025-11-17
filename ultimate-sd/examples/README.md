# Example Diagrams

This folder contains sample `.sdd` (System Design Diagram) files that demonstrate various system architectures.

## Available Examples

### sample-diagram.sdd
A basic web application architecture demonstrating:
- **Client Layer**: Web and mobile clients
- **Load Balancing**: Traffic distribution across servers
- **Application Tier**: Multiple app servers for redundancy
- **Caching Layer**: Redis cache for performance
- **Data Layer**: PostgreSQL database for persistence
- **Async Processing**: Message queue for background jobs

**Components Used**:
- Client (Users & Mobile Apps)
- Load Balancer
- 2x Application Servers
- Redis Cache
- PostgreSQL Database
- Message Queue
- Arrows showing data flow

**Use Case**: Demonstrates a typical 3-tier web application with caching and async processing.

## How to Use These Examples

1. **Load in the App**:
   - Open the diagram canvas
   - Click the "Load" button in the toolbar
   - Select any `.sdd` file from this folder
   - The diagram will appear on your canvas

2. **Learn from the Structure**:
   - Study how components are connected
   - See how different element types are used
   - Understand typical architecture patterns

3. **Customize**:
   - Load an example as a starting point
   - Modify it for your needs
   - Save your customized version

4. **Use as Templates**:
   - Load an example
   - Replace labels with your components
   - Adjust connections and layout
   - Save as your own design

## Creating Your Own Examples

Want to contribute an example? Follow this pattern:

```json
{
  "version": "1.0",
  "type": "system-design-diagram",
  "timestamp": "[ISO timestamp]",
  "elements": [
    // Your diagram elements
  ],
  "settings": {
    "showGrid": true
  }
}
```

### Naming Convention
Use descriptive names that indicate the architecture pattern:
- `microservices-ecommerce.sdd`
- `cdn-video-streaming.sdd`
- `event-driven-payments.sdd`
- `distributed-cache-pattern.sdd`

### File Organization
Future examples could be organized by:
- `/patterns/` - Common architectural patterns
- `/systems/` - Specific system designs (Twitter, YouTube, etc.)
- `/components/` - Reusable component templates
- `/faang/` - FAANG-style interview problems

## Tips for Working with Examples

1. **Start Simple**: Begin with `sample-diagram.sdd` to understand the basics
2. **Experiment**: Load, modify, and re-save to learn the tool
3. **Compare**: Load different examples to see various approaches
4. **Build Libraries**: Save your own common patterns as templates

## File Format Documentation

For detailed information about the `.sdd` file format, see: `DIAGRAM_STATE_FILE.md`

## Contributing Examples

Have a great system design diagram? Consider contributing:
1. Create your diagram in the app
2. Save it with a descriptive name
3. Add it to this folder
4. Update this README with a description

## Future Examples (Coming Soon)

- **Microservices Architecture**: Service mesh, API gateway, multiple services
- **Streaming Platform**: CDN, video encoding, adaptive bitrate
- **Social Media Feed**: Real-time updates, fan-out patterns
- **E-commerce Platform**: Payment processing, inventory management
- **Ride-Sharing System**: Real-time matching, GPS tracking
- **Search Engine**: Crawling, indexing, ranking
- **Chat Application**: WebSocket connections, message queuing
- **IoT Platform**: Device management, data ingestion, analytics

Each example will demonstrate different aspects of system design and use various component types available in the diagram tool.
