💥 The Bug: When the AI provides feedback, it often wraps the JSON response in markdown code blocks, which causes `JSON.parse` to crash and silently breaks the feedback flow.
🔍 Root Cause: Directly passing `response.content` to `JSON.parse` without sanitizing it meant that perfectly valid JSON, when wrapped in standard markdown fences, resulted in a fatal parse error.
🛠️ The Fix: Replaced the direct `JSON.parse` call with a step to strip out markdown fences before parsing the AI's content in `src/lib/langgraph.ts`.
🛡️ Prevention: Wrote `src/lib/__tests__/langgraph-getfeedback.test.ts` to explicitly assert that `getFeedback` strips markdown blocks correctly when parsing responses, ensuring it gracefully handles AI models that inject conversational text or markdown blocks.
