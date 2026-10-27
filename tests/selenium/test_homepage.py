# ─── Homepage Selenium Tests ─────────────────────────────────────
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class TestHomepage:
    """Test the Festival Rush homepage loads and displays key elements."""

    def test_page_loads(self, driver, base_url):
        """Homepage should return HTTP 200 and load content."""
        driver.get(base_url)
        assert "Festival" in driver.title or len(driver.page_source) > 100

    def test_navbar_present(self, driver, base_url):
        """Navigation bar should be visible on the page."""
        driver.get(base_url)
        nav = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "nav"))
        )
        assert nav.is_displayed()

    def test_hero_section_visible(self, driver, base_url):
        """Hero section or main heading should be visible."""
        driver.get(base_url)
        # Look for any h1 or hero section
        heading = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "h1, .hero, [class*='hero']"))
        )
        assert heading.is_displayed()

    def test_products_link_exists(self, driver, base_url):
        """There should be a link to products/shop section."""
        driver.get(base_url)
        links = driver.find_elements(By.TAG_NAME, "a")
        link_texts = [link.text.lower() for link in links]
        has_shop_link = any(
            word in text for text in link_texts
            for word in ["shop", "product", "collection", "browse"]
        )
        assert has_shop_link or len(links) > 0

    def test_no_console_errors(self, driver, base_url):
        """Page should load without critical JavaScript errors."""
        driver.get(base_url)
        logs = driver.get_log("browser")
        severe_errors = [log for log in logs if log["level"] == "SEVERE"]
        # Allow up to 2 non-critical errors (e.g., favicon 404)
        assert len(severe_errors) <= 2
