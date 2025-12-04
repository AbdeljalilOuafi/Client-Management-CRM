from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthViewSet, AccountViewSet, EmployeeViewSet, EmployeeRoleViewSet, ClientViewSet,
    PackageViewSet, ClientPackageViewSet, PaymentViewSet,
    InstallmentViewSet, StripeCustomerViewSet,
    CheckInFormViewSet, CheckInScheduleViewSet, CheckInSubmissionViewSet,
    checkin_trigger_webhook, get_checkin_form, submit_checkin_form,
    get_onboarding_form, submit_onboarding_form,
    reviews_trigger_webhook, get_reviews_form, submit_reviews_form,
    configure_custom_domain, regenerate_client_links, get_domain_config,
    update_domain_config, delete_domain_config,
    configure_payment_domain, get_payment_domain_config,
    update_payment_domain, remove_payment_domain
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
    # Internal webhook trigger endpoints
    path('internal/checkin-trigger/', checkin_trigger_webhook, name='checkin-trigger'),
    path('internal/reviews-trigger/', reviews_trigger_webhook, name='reviews-trigger'),
    # Public check-in endpoints
    path('public/checkin/<uuid:checkin_uuid>/', get_checkin_form, name='public-checkin-form'),
    path('public/checkin/<uuid:checkin_uuid>/submit/', submit_checkin_form, name='public-checkin-submit'),
    # Public onboarding endpoints
    path('public/onboarding/<uuid:onboarding_uuid>/', get_onboarding_form, name='public-onboarding-form'),
    path('public/onboarding/<uuid:onboarding_uuid>/submit/', submit_onboarding_form, name='public-onboarding-submit'),
    # Public reviews endpoints
    path('public/reviews/<uuid:reviews_uuid>/', get_reviews_form, name='public-reviews-form'),
    path('public/reviews/<uuid:reviews_uuid>/submit/', submit_reviews_form, name='public-reviews-submit'),
    # Custom domain management endpoints
    path('domains/configure/', configure_custom_domain, name='configure-domain'),
    path('domains/regenerate-links/', regenerate_client_links, name='regenerate-links'),
    path('domains/', get_domain_config, name='get-domain'),
    path('domains/update/', update_domain_config, name='update-domain'),
    path('domains/delete/', delete_domain_config, name='delete-domain'),
    # Payment domain management endpoints
    path('domains/payment/configure/', configure_payment_domain, name='configure-payment-domain'),
    path('domains/payment/', get_payment_domain_config, name='get-payment-domain'),
    path('domains/payment/update/', update_payment_domain, name='update-payment-domain'),
    path('domains/payment/delete/', remove_payment_domain, name='delete-payment-domain'),
]
