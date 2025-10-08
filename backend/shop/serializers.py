from rest_framework import serializers
from .models import Category, Product, ProductImage, Inventory, Discount, Order


# -----------------------------
# ✅ Category Serializer
# -----------------------------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


# -----------------------------
# ✅ Product Image Serializer
# -----------------------------
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = "__all__"


# -----------------------------
# ✅ Product Serializer
# -----------------------------
class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = "__all__"


# -----------------------------
# ✅ Inventory Serializer
# -----------------------------
class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = Inventory
        fields = [
            "id",
            "product",
            "product_name",
            "quantity_in",
            "quantity_out",
            "status",
        ]


# -----------------------------
# ✅ Discount Serializer
# -----------------------------
class DiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discount
        fields = "__all__"


# -----------------------------
# ✅ Order Serializer
# -----------------------------
class OrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "total_price",
            "status",
            "created_at",
        ]
