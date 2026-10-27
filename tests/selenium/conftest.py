# ─── Selenium Test Config ────────────────────────────────────────
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


@pytest.fixture(scope="session")
def driver():
    """Create a headless Chrome WebDriver for testing."""
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")

    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(10)

    yield driver
    driver.quit()


@pytest.fixture(scope="session")
def base_url():
    """Base URL — set APP_URL env var for deployed app, or use localhost."""
    import os
    return os.getenv("APP_URL", "http://localhost:80")
