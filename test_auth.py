from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:3000/#problems")
        page.wait_for_timeout(2000)

        print("All buttons on page:")
        for el in page.locator("button").all_inner_texts():
             print(f"[{el}]")

        browser.close()

if __name__ == "__main__":
    run()
