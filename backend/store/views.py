from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models.functions import TruncMonth
from django.db.models import Count

from .models import (
    Payment, ShippingAddress, Order, OrderItem,
    CartItem, DiscountType, Discount, Inventory
)

from .serializers import (
    PaymentSerializer, ShippingAddressSerializer, OrderSerializer,
    OrderItemSerializer, CartItemSerializer, DiscountTypeSerializer,
    DiscountSerializer, InventorySerializer
)


# ---------- ViewSets ----------
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer


class ShippingAddressViewSet(viewsets.ModelViewSet):
    queryset = ShippingAddress.objects.all()
    serializer_class = ShippingAddressSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer


class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer


class CartItemViewSet(viewsets.ModelViewSet):
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer


class DiscountTypeViewSet(viewsets.ModelViewSet):
    queryset = DiscountType.objects.all()
    serializer_class = DiscountTypeSerializer


class DiscountViewSet(viewsets.ModelViewSet):
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer


class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer


# ---------- Custom Analytics Endpoint ----------
@api_view(["GET"])
def orders_by_month(request):
    """
    Vraća broj narudžbi grupisanih po mesecima.
    """
    data = (
        Order.objects.annotate(month=TruncMonth("time_created"))
        .values("month")
        .annotate(order_count=Count("id"))
        .order_by("month")
    )
    return Response(data)
