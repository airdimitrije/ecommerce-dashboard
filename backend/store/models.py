from django.db import models
from core.models import User
from shop.models import Product


class Payment(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class ShippingAddress(models.Model):
    country = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    street = models.CharField(max_length=100)
    street_number = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.city}, {self.street} {self.street_number}"


class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True)
    shipping_address = models.ForeignKey(ShippingAddress, on_delete=models.SET_NULL, null=True, blank=True)
    time_created = models.DateTimeField(auto_now_add=True)
    time_updated = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=50, default="pending")

    def __str__(self):
        return f"Order {self.id} by {self.user.username}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    final_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.order.id} - {self.product.name}"


class CartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    time_uploaded = models.DateTimeField(auto_now_add=True)
    time_created = models.DateTimeField(auto_now_add=True)
    time_canceled = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=50, default="active")

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"


class DiscountType(models.Model):
    type = models.CharField(max_length=100)

    def __str__(self):
        return self.type


class Discount(models.Model):
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_type = models.ForeignKey(DiscountType, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, blank=True, null=True)

    def __str__(self):
        return f"{self.amount} {self.discount_type.type}"


class Inventory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity_in = models.IntegerField(default=0)
    quantity_out = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default="available")
    discount = models.ForeignKey(Discount, on_delete=models.SET_NULL, null=True, blank=True)

    @property
    def stock(self):
        return self.quantity_in - self.quantity_out

    def __str__(self):
        return f"{self.product.name} - Stock: {self.stock}"
