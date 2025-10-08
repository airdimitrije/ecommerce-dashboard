from django.db import models


# -----------------------------
# ✅ Category model
# -----------------------------
class Category(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.name


# -----------------------------
# ✅ Product model
# -----------------------------
class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    sku = models.CharField(max_length=100, unique=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


# -----------------------------
# ✅ Product Image model
# -----------------------------
class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/")

    def __str__(self):
        return f"Image for {self.product.name}"


# -----------------------------
# ✅ Inventory model (fixed conflict)
# -----------------------------
class Inventory(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="shop_inventory"  # ✅ unique related_name to avoid clash with store.Inventory
    )
    quantity_in = models.IntegerField(default=0)
    quantity_out = models.IntegerField(default=0)
    status = models.CharField(max_length=20, default="available")

    def __str__(self):
        return f"{self.product.name} ({self.status})"


# -----------------------------
# ✅ Discount model
# -----------------------------
class Discount(models.Model):
    name = models.CharField(max_length=100)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.percentage}%)"


# -----------------------------
# ✅ Order model
# -----------------------------
class Order(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} - {self.product.name}"
