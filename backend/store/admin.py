from django.contrib import admin
from .models import Payment, ShippingAddress, Order, OrderItem, CartItem, DiscountType, Discount, Inventory

admin.site.register(Payment)
admin.site.register(ShippingAddress)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(CartItem)
admin.site.register(DiscountType)
admin.site.register(Discount)
admin.site.register(Inventory)
