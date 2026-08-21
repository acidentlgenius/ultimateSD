💥 The Bug
In `MessageQueueVisualizer.tsx`, an interval was created inside a `useEffect` that had `messages` in its dependency array. Because `messages` updates frequently (every time a new message is published), the `useEffect` would constantly clear and recreate the interval. If messages were published rapidly (e.g., every 300ms) relative to the interval duration (1000ms), the interval would never get a chance to fire. This resulted in "interval starvation," completely halting the background message processing logic.

🔍 Root Cause
The interval was tied directly to the `messages` state dependency, meaning any state change reset the timer before it could execute its callback.

🛠️ The Fix
Introduced a `messagesRef` to hold the most up-to-date `messages` state. Extracted the `consumeMessages` logic into a `useCallback` that reads from `messagesRef.current` rather than the stale closure of `messages`. Updated the interval's `useEffect` to depend only on the stable `consumeMessages` callback, allowing the interval to fire consistently without being prematurely cleared by state updates.

🛡️ Prevention
Added a targeted regression test (`MessageQueueVisualizer.test.tsx`) that specifically simulates rapid message publishing and verifies that consumers still correctly advance their offsets (proving the interval fires).
