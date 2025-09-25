from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PaymentViewSet, ShippingAddressViewSet, OrderViewSet, OrderItemViewSet,
    CartItemViewSet, DiscountTypeViewSet, DiscountViewSet, InventoryViewSet,
    orders_by_month
)

# Router za standardne ViewSet-ove
router = DefaultRouter()
router.register(r'payments', PaymentViewSet)
router.register(r'shipping-addresses', ShippingAddressViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'order-items', OrderItemViewSet)
router.register(r'cart-items', CartItemViewSet)
router.register(r'discount-types', DiscountTypeViewSet)
router.register(r'discounts', DiscountViewSet)
router.register(r'inventory', InventoryViewSet)

# Custom rute
urlpatterns = [
    path('', include(router.urls)),
    path('orders-by-month/', orders_by_month, name="orders-by-month"),
]
