from playwright.sync_api import sync_playwright

def verify_load_balancer():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the problem page directly
        # The URL seems to be /practice/[slug]
        page.goto("http://localhost:3000/practice/design-load-balancer")

        # Wait for the page to load
        page.wait_for_load_state("networkidle")

        # Wait for Skip button
        page.wait_for_selector("button:has-text('Skip')", timeout=10000)
        page.click("button:has-text('Skip')")
        page.wait_for_timeout(500)

        # Step 2
        page.click("button:has-text('Skip')")
        page.wait_for_timeout(500)

        # Step 3: Should see "Load Balancer" widget
        page.wait_for_selector("text=Load Balancer", timeout=5000)

        # Click "Send Traffic"
        page.click("button:has-text('Send Traffic')")

        # Wait a bit for animation
        page.wait_for_timeout(1500)

        # Take a screenshot
        page.screenshot(path="verification/load_balancer_page.png")

        browser.close()

if __name__ == "__main__":
    verify_load_balancer()
