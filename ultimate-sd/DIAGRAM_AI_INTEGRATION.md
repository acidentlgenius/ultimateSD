# Diagram AI Integration - Feature Documentation

## Overview

The diagram canvas is now fully integrated with AI evaluation! When you create architecture diagrams during HLD (High-Level Design) or LLD (Low-Level Design) phases, you can share them with the AI for comprehensive feedback.

## ✅ What's Fixed

**Before:**
- ❌ "Share with AI" button showed generic alert: "Describe the image in the chat..."
- ❌ Diagrams were not captured or analyzed
- ❌ AI evaluation didn't consider visual architecture
- ❌ No feedback on diagram quality or completeness

**After:**
- ✅ "Share with AI" captures your diagram automatically
- ✅ AI receives diagram metadata (components, count, description)
- ✅ Evaluation includes both text description AND diagram
- ✅ Visual confirmation when diagram is captured
- ✅ Warnings if diagram is missing when expected

## 🎯 How It Works

### 1. Create Your Diagram

When you're on an HLD or LLD architecture step:

1. Use the diagram canvas (shown below the chat interface)
2. Add components: servers, databases, load balancers, caches, etc.
3. Connect them with arrows and lines
4. Add labels to components

### 2. Share with AI

Click the **"Share with AI"** button in the diagram canvas header:

```
┌─────────────────────────────────────────────────┐
│ 🎨 System Design Diagram                        │
│ Create your architecture diagram...             │
│                                                  │
│    [Export PNG]  [Share with AI] ←── Click here │
└─────────────────────────────────────────────────┘
```

**What happens:**
- ✅ Canvas is captured as PNG image
- ✅ Component count and types are extracted
- ✅ Automatic description is generated
- ✅ Data is stored for AI evaluation
- ✅ Success modal confirms capture

### 3. Describe Your Architecture

In the text area above, write your architecture description:

```
My architecture uses:
- Load balancer to distribute traffic
- 3 application servers for stateless processing
- PostgreSQL primary with read replicas
- Redis cache for hot data
- S3 for media storage
- CloudFront CDN for static assets
```

### 4. Submit for Evaluation

Click **"Submit for Review"**:

- AI receives BOTH your text description AND diagram metadata
- Evaluation considers:
  - Text clarity and completeness
  - Diagram component coverage
  - Alignment between description and visual
  - Missing components or connections

## 📊 Visual Indicators

### Diagram Status Badge

When on an architecture step (HLD or LLD), you'll see a status indicator:

**✅ Diagram Captured:**
```
┌─────────────────────────────────────────────────┐
│ ✓ Diagram Captured!                             │
│ Diagram contains 12 elements including:         │
│ database, server, cache • Will be included in   │
│ AI evaluation                                    │
└─────────────────────────────────────────────────┘
```

**⚠️ Diagram Missing:**
```
┌─────────────────────────────────────────────────┐
│ ⚠ Tip: Create a Diagram                         │
│ Draw your architecture in the diagram canvas    │
│ below, then click "Share with AI" before        │
│ submitting                                       │
└─────────────────────────────────────────────────┘
```

### Success Modal

After clicking "Share with AI":

```
╔═════════════════════════════════════════════════╗
║  ✓ Diagram Captured!                            ║
║                                                 ║
║  Your diagram has been saved. Now describe your ║
║  architecture in the chat, and the AI will      ║
║  provide feedback on both your description and  ║
║  diagram!                                       ║
║                                                 ║
║  Components detected: loadbalancer, server,     ║
║  database, cache, cdn                           ║
║                                                 ║
║              [Got it!]                          ║
╚═════════════════════════════════════════════════╝
```

## 🔍 What AI Analyzes

When you include a diagram, the AI considers:

### Component Coverage
- Are all major system components represented?
- Database (PostgreSQL, MongoDB, etc.)
- Caching layer (Redis, Memcached)
- Load balancers
- Application servers
- Message queues (Kafka, RabbitMQ)
- CDN for static assets
- Object storage (S3)

### Architecture Completeness
- Are connections/data flows shown?
- Are components properly labeled?
- Does the diagram match your text description?
- Are all mentioned components visualized?

### System Design Best Practices
- Appropriate use of each component
- Proper placement in architecture
- Scalability considerations visible
- Redundancy/fault tolerance shown

## 📝 Best Practices

### ✅ Do's

1. **Create diagram first, then describe**
   - Visual aids help you think through the design
   - Easier to write description with diagram in front of you

2. **Use specific component types**
   - Don't use generic rectangles—use database, server, cache icons
   - AI can detect component types automatically

3. **Label your components**
   - Click a component → "Add Label" button
   - Use meaningful names (e.g., "User DB", "Redis Cache")

4. **Show data flow with arrows**
   - Use arrows to indicate request/response paths
   - Helps AI understand your architecture

5. **Share diagram before submitting**
   - Always click "Share with AI" first
   - Then fill in text description
   - Then submit for evaluation

6. **Match text and diagram**
   - If you mention "load balancer" in text, show it in diagram
   - Consistency between description and visual matters

### ❌ Don'ts

1. **Don't submit without diagram on architecture steps**
   - AI will note the absence in feedback
   - Lower scores for incomplete submissions

2. **Don't use too few components**
   - A production system needs multiple layers
   - Minimum: client → load balancer → app → database

3. **Don't forget to connect components**
   - Floating boxes without arrows aren't helpful
   - Show how data flows through your system

4. **Don't create diagram and forget to share**
   - Just drawing isn't enough—must click "Share with AI"
   - Check for green "✓ Diagram Captured!" badge

## 🎓 Example Workflow

### Complete HLD Architecture Step

**Step 1: Draw Diagram**
```
[Client] ──→ [Load Balancer] ──→ [App Server 1]
                   ↓                    ↓
             [App Server 2] ──→ [PostgreSQL Primary]
                   ↓                    ↓
             [Redis Cache]      [PostgreSQL Replica]
                                        ↓
                                   [S3 Storage]
                                        ↓
                                   [CloudFront CDN]
```

**Step 2: Share with AI**
- Click "Share with AI" button
- Wait for success modal
- Confirm green "✓ Diagram Captured!" badge appears

**Step 3: Write Description**
```
My architecture consists of:

1. Load Balancer (nginx) - Distributes incoming requests
2. Application Servers (3x) - Stateless Node.js servers
3. PostgreSQL Database - Primary + read replica for scalability
4. Redis Cache - Stores hot data, reduces DB load
5. S3 + CloudFront - Media storage and CDN

Request flow:
- User request → Load balancer
- Load balancer → App server (round-robin)
- App server → Check Redis cache
- Cache miss → Query PostgreSQL (replica for reads)
- Response cached in Redis for future requests
```

**Step 4: Submit**
- Click "Submit for Review"
- AI evaluates BOTH text and diagram
- Receive comprehensive feedback

**Expected Feedback:**
```
Score: 9/10
Accuracy: 85%

✓ Strengths:
- Complete architecture with all major components
- Clear data flow explanation
- Proper use of caching layer
- Read replica for scalability
- CDN for static assets

⚠ Areas to Improve:
- Consider adding message queue for async operations
- Mention monitoring/logging layer
- Discuss backup strategy for database

💡 Key Points Missed:
- How does the load balancer detect server failures?
- What's the cache invalidation strategy?
- Where is user session stored (stateless mentioned)?
```

## 🐛 Troubleshooting

### "Diagram not captured"

**Symptoms:**
- Clicked "Share with AI" but no success modal
- No green "✓ Diagram Captured!" badge

**Solutions:**
1. Ensure you've drawn at least one component
2. Check browser console for errors (F12)
3. Try refreshing page and redrawing
4. Use a modern browser (Chrome, Firefox, Edge)

### "AI doesn't mention my diagram"

**Symptoms:**
- Submitted with diagram but feedback doesn't reference it
- Feels like AI only evaluated text

**Solutions:**
1. Verify green badge showed before submitting
2. Make sure you're on an architecture step (HLD/LLD only)
3. Check that diagram description appears in your answer
4. Look for `[Diagram included with X components]` in submission

### "Empty diagram but no warning"

**Symptoms:**
- Canvas is blank but system doesn't warn you

**Solutions:**
1. Warning only appears on architecture steps (HLD/LLD)
2. Other steps (API, data model) don't require diagrams
3. This is intentional behavior—diagrams are optional for some steps

### "Diagram from previous step showing"

**Symptoms:**
- Moved to new phase but old diagram data still cached

**Solutions:**
1. Create a new diagram for the new phase
2. Click "Share with AI" again to update
3. Or clear the canvas and share empty to reset
4. Session persistence keeps old data until updated

## 🔮 Future Enhancements

Planned improvements:

- [ ] **Image analysis**: AI directly analyzes the PNG image (OCR/computer vision)
- [ ] **Diagram quality score**: Separate score for visual design
- [ ] **Auto-share**: Automatically capture diagram on submit (no manual click)
- [ ] **Diagram history**: View diagrams from all completed steps
- [ ] **Diagram comparison**: Compare your diagram to reference solutions
- [ ] **Export with annotations**: AI adds comments directly on diagram
- [ ] **Real-time feedback**: Suggestions as you draw components

## 📖 Related Documentation

- [Diagram Canvas User Guide](./DIAGRAM_IMPROVEMENTS.md)
- [AI Evaluation System](./README.md#ai-powered-feedback)
- [Session Persistence](./SESSION_PERSISTENCE.md)

## 🎯 Quick Reference

| Action | How To | When |
|--------|--------|------|
| Create diagram | Use toolbar, drag on canvas | HLD/LLD phases |
| Share with AI | Click "Share with AI" button | Before submitting |
| Check status | Look for green/orange badge | Architecture steps |
| Include in eval | Just submit after sharing | Automatic |
| Reset diagram | Clear canvas, share again | Anytime |

---

**Remember**: Diagrams are most valuable for HLD and LLD architecture steps. Create clear, labeled visuals and share them with AI before submitting for the best evaluation! 🎨✨
