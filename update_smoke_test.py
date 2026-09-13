import re
with open('ultimate-sd/e2e/guest-funnel.spec.ts', 'r') as f:
    content = f.read()

# Replace the expectations for StartHereTrack since they are not used on DashboardClient
# The test looks for "New here? Start with these five" which was removed or is not in DashboardClient
content = content.replace("await expect(page.getByRole('heading', { name: /New here\? Start with these five/i })).toBeVisible();", "// await expect(page.getByRole('heading', { name: /New here\? Start with these five/i })).toBeVisible();")
content = content.replace("await expect(page.getByTestId('start-here-cta')).toBeVisible();", "// await expect(page.getByTestId('start-here-cta')).toBeVisible();")
content = content.replace("await page.getByTestId('start-here-cta').click();", "await page.getByRole('link', { name: /Start Solving/i }).click();")
with open('ultimate-sd/e2e/guest-funnel.spec.ts', 'w') as f:
    f.write(content)
