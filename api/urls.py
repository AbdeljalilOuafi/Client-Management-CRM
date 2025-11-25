from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthViewSet, AccountViewSet, EmployeeViewSet, EmployeeRoleViewSet, ClientViewSet,
    PackageViewSet, ClientPackageViewSet, PaymentViewSet,
    InstallmentViewSet, StripeCustomerViewSet,
    CheckInFormViewSet, CheckInScheduleViewSet, CheckInSubmissionViewSet,
    checkin_trigger_webhook, get_checkin_form, submit_checkin_form,
    configure_custom_domain, regenerate_client_links, get_domain_config,
    update_domain_config, delete_domain_config
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
router.register(r'checkin-forms', CheckInFormViewSet, basename='checkin-form')
router.register(r'checkin-schedules', CheckInScheduleViewSet, basename='checkin-schedule')
router.register(r'checkin-submissions', CheckInSubmissionViewSet, basename='checkin-submission')

urlpatterns = [
    path('', include(router.urls)),
    # Internal webhook trigger endpoint
    path('internal/checkin-trigger/', checkin_trigger_webhook, name='checkin-trigger'),
    # Public check-in endpoints
    path('public/checkin/<uuid:checkin_uuid>/', get_checkin_form, name='public-checkin-form'),
    path('public/checkin/<uuid:checkin_uuid>/submit/', submit_checkin_form, name='public-checkin-submit'),
    # Custom domain management endpoints
    path('domains/configure/', configure_custom_domain, name='configure-domain'),
    path('domains/regenerate-links/', regenerate_client_links, name='regenerate-links'),
    path('domains/', get_domain_config, name='get-domain'),
    path('domains/update/', update_domain_config, name='update-domain'),
    path('domains/delete/', delete_domain_config, name='delete-domain'),
]
