from rest_framework import viewsets, filters
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product, ProductImage
from .serializers import CategorySerializer, ProductSerializer, ProductImageSerializer


class ProductPagination(PageNumberPagination):
    page_size = 8  
    page_size_query_param = "page_size"
    max_page_size = 9999  # ← Povećaj za statistiku


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("id")
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["id", "name"]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("id")
    serializer_class = ProductSerializer
    pagination_class = ProductPagination
    
    # ✅ Dodaj DjangoFilterBackend
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # ✅ Search po imenu i opisu
    search_fields = ["name", "description"]
    
    # ✅ Filter po kategoriji i range cijene
    filterset_fields = {
        'category': ['exact'],
        'price': ['gte', 'lte'],
    }
    
    # ✅ Sortiranje
    ordering_fields = ["price", "name", "id"]
    ordering = ["id"]


class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all().order_by("id")
    serializer_class = ProductImageSerializer