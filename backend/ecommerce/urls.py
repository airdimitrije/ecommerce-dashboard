"""
URL configuration for ecommerce project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from core.views import UserViewSet, RoleViewSet
from shop.views import CategoryViewSet, ProductViewSet, ProductImageViewSet
from store.views import (
    PaymentViewSet, ShippingAddressViewSet, OrderViewSet, OrderItemViewSet,
    CartItemViewSet, DiscountTypeViewSet, DiscountViewSet, InventoryViewSet
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

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/", include('store.urls')),
]

