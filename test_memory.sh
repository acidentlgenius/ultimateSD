#!/bin/bash
cat << 'MEMORY_RULE'
When simulating input events (like `keyboard.press('Enter')`) in Playwright E2E tests that enable a submit button, explicitly wait for the button's state to change (e.g., `await expect(page.getByRole('button')).toBeEnabled()`) before clicking to avoid 'element is not enabled' failures caused by React state update races.
MEMORY_RULE
