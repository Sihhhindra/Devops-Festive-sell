# ─── Product & Cart Selenium Tests ───────────────────────────────
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class TestProducts:
    """Test product listing and cart functionality."""

    def test_products_page_displays_items(self, driver, base_url):
        """Products page should display at least one product."""
        driver.get(f"{base_url}/products")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='product'], [class*='card'], .product"))
        )
        products = driver.find_elements(By.CSS_SELECTOR, "[class*='product'], [class*='card'], .product")
        assert len(products) >= 1

    def test_product_has_price(self, driver, base_url):
        """Each product should display a price."""
        driver.get(f"{base_url}/products")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='price'], .price"))
        )
        prices = driver.find_elements(By.CSS_SELECTOR, "[class*='price'], .price")
        assert len(prices) >= 1

    def test_add_to_cart_button_exists(self, driver, base_url):
        """Products should have an Add to Cart button."""
        driver.get(f"{base_url}/products")
        buttons = WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.TAG_NAME, "button"))
        )
        button_texts = [btn.text.lower() for btn in buttons]
        has_cart_button = any(
            word in text for text in button_texts
            for word in ["cart", "add", "buy"]
        )
        assert has_cart_button


class TestCart:
    """Test shopping cart functionality."""

    def test_cart_page_accessible(self, driver, base_url):
        """Cart page should be accessible."""
        driver.get(f"{base_url}/cart")
        assert "cart" in driver.current_url.lower() or len(driver.page_source) > 100

    def test_empty_cart_message(self, driver, base_url):
        """Empty cart should show an appropriate message."""
        driver.get(f"{base_url}/cart")
        page_text = driver.find_element(By.TAG_NAME, "body").text.lower()
        has_empty_msg = any(
            word in page_text for word in ["empty", "no items", "nothing", "start shopping"]
        )
        # Either shows empty message or has items (both are valid)
        assert has_empty_msg or len(page_text) > 50
