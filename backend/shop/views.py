from rest_framework import viewsets, filters
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product, ProductImage, Inventory, Discount, Order
from .serializers import (
    CategorySerializer, 
    ProductSerializer, 
    ProductImageSerializer,
    InventorySerializer,
    DiscountSerializer,
    OrderSerializer
)


class StandardPagination(PageNumberPagination):
    page_size = 8
    page_size_query_param = "page_size"
    max_page_size = 9999


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("id")
    serializer_class = CategorySerializer
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["id", "name"]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("id")
    serializer_class = ProductSerializer
    pagination_class = StandardPagination
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    search_fields = ["name", "description"]
    
    filterset_fields = {
        'category': ['exact'],
        'price': ['gte', 'lte'],
    }
    
    ordering_fields = ["price", "name", "id", "category"]
    ordering = ["id"]


class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all().order_by("id")
    serializer_class = ProductImageSerializer
    pagination_class = StandardPagination


class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all().order_by("id")
    serializer_class = InventorySerializer
    pagination_class = StandardPagination
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    filterset_fields = {
        'product': ['exact'],
        'status': ['exact'],
    }
    
    ordering_fields = ["id", "quantity_in", "quantity_out"]
    ordering = ["id"]


class DiscountViewSet(viewsets.ModelViewSet):
    queryset = Discount.objects.all().order_by("id")
    serializer_class = DiscountSerializer
    pagination_class = StandardPagination


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by("-id")
    serializer_class = OrderSerializer
    pagination_class = StandardPagination
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    filterset_fields = {
        'status': ['exact'],
    }
    
    ordering_fields = ["id", "created_at", "total_price"]
    ordering = ["-created_at"]