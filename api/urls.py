from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthViewSet, AccountViewSet, EmployeeViewSet, EmployeeRoleViewSet, ClientViewSet,
    PackageViewSet, ClientPackageViewSet, PaymentViewSet,
    InstallmentViewSet, StripeCustomerViewSet
)

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'employee-roles', EmployeeRoleViewSet, basename='employee-role')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'packages', PackageViewSet, basename='package')
router.register(r'client-packages', ClientPackageViewSet, basename='client-package')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'installments', InstallmentViewSet, basename='installment')
router.register(r'stripe-customers', StripeCustomerViewSet, basename='stripe-customer')

urlpatterns = [
    path('', include(router.urls)),
]
