"""
URL configuration for ecommerce project.

Routes:
- /api/products/ — svi proizvodi (GET, POST, PUT, DELETE)
- /api/products/?search=ime — pretraga
- /api/products/?ordering=-price — sortiranje
- /api/products/?page=2 — paginacija
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.http import JsonResponse


from core.views import UserViewSet, RoleViewSet
from shop.views import CategoryViewSet, ProductViewSet, ProductImageViewSet
from store.views import (
    PaymentViewSet, ShippingAddressViewSet, OrderViewSet, OrderItemViewSet,
    CartItemViewSet, DiscountTypeViewSet, DiscountViewSet, InventoryViewSet,
)


router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'roles', RoleViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'product-images', ProductImageViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'shipping-addresses', ShippingAddressViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'order-items', OrderItemViewSet)
router.register(r'cart-items', CartItemViewSet)
router.register(r'discount-types', DiscountTypeViewSet)
router.register(r'discounts', DiscountViewSet)
router.register(r'inventory', InventoryViewSet)



def health_check(request):
    return JsonResponse({"status": "ok", "message": "API radi normalno!"})



urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/", include("store.urls")),
    path("api/health/", health_check),
]
