---
trigger: manual
---

# Notion MCP API Issue: Tasks Tracker Database

## Issue Summary

The Tasks Tracker database (`2cf8791d-37ad-80e7-b7b9-f0223f56a466`) cannot be queried via the Notion MCP API.

## Error Details

**Error Code:** `400`
**Error Message:** `Invalid request URL`
**Affected Endpoints:**
- `mcp_notion-mcp-server_API-query-data-source`
- `mcp_notion-mcp-server_API-retrieve-a-data-source`

## Verification

✅ Database exists and is accessible via search:
```json
{
  "object": "database",
  "id": "2cf8791d-37ad-80e7-b7b9-f0223f56a466",
  "title": [{"plain_text": "Tasks Tracker"}]
}
```

✅ Database properties are visible:
- Task name (title)
- Status
- Priority
- Task type
- Effort level
- Assignee
- Due date
- Description
- Updated at

❌ Query attempts fail with 400 error

## Attempted Solutions

1. ✅ Verified database ID format
2. ✅ Confirmed database exists via search
3. ✅ Tested with minimal query parameters
4. ❌ Query still fails

## Workaround

Use **Ultimate-SD page** (`2cf8791d-37ad-80d8-936a-e8fa75e838c7`) for all updates until this issue is resolved.

## Next Steps

1. Investigate Notion MCP server logs
2. Check database permissions/sharing settings
3. Verify integration has correct access scopes
4. Test with Notion API directly (bypassing MCP)
5. Contact MCP server maintainer if needed

## Related Files

- `.agent/rules/request-guidelines.md` - Main guidelines
- `.agent/rules/notion-update-template.md` - Update templates