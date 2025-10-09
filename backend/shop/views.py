from rest_framework import status, viewsets, filters
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import ProtectedError
from .models import Category, Product, ProductImage, Inventory, Discount, Order
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductImageSerializer,
    InventorySerializer,
    DiscountSerializer,
    OrderSerializer
)
from .pagination import StandardPagination  # ✅ sada se importuje iz pagination.py


# -----------------------------
# ✅ Category ViewSet
# -----------------------------
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("id")
    serializer_class = CategorySerializer
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["id", "name"]


# -----------------------------
# ✅ Product ViewSet (sigurno brisanje)
# -----------------------------
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("id")
    serializer_class = ProductSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    filterset_fields = {
        "category": ["exact"],
        "price": ["gte", "lte"],
    }
    ordering_fields = ["price", "name", "id", "category"]
    ordering = ["id"]

    def destroy(self, request, *args, **kwargs):
        """
        ✅ Sigurno brisanje proizvoda — ne dozvoljava ako proizvod postoji u narudžbinama.
        """
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {"error": "Ovaj proizvod ne može biti obrisan jer postoji u narudžbinama."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": f"Greška prilikom brisanja: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# -----------------------------
# ✅ Product Image ViewSet
# -----------------------------
class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all().order_by("id")
    serializer_class = ProductImageSerializer
    pagination_class = StandardPagination


# -----------------------------
# ✅ Inventory ViewSet
# -----------------------------
class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all().order_by("id")
    serializer_class = InventorySerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        "product": ["exact"],
        "status": ["exact"],
    }
    ordering_fields = ["id", "quantity_in", "quantity_out"]
    ordering = ["id"]


# -----------------------------
# ✅ Discount ViewSet
# -----------------------------
class DiscountViewSet(viewsets.ModelViewSet):
    queryset = Discount.objects.all().order_by("id")
    serializer_class = DiscountSerializer
    pagination_class = StandardPagination


# -----------------------------
# ✅ Order ViewSet
# -----------------------------
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by("-id")
    serializer_class = OrderSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        "status": ["exact"],
    }
    ordering_fields = ["id", "created_at", "total_price"]
    ordering = ["-created_at"]
