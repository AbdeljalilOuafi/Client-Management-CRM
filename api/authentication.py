"""
Custom authentication for Employee model using EmployeeToken
"""
from rest_framework.authentication import TokenAuthentication
from rest_framework import exceptions
from .models import EmployeeToken


class EmployeeTokenAuthentication(TokenAuthentication):
    """
    Custom token authentication using EmployeeToken model
    This is separate from DRF's default Token to avoid conflicts with other applications
    """
    model = EmployeeToken
    keyword = 'Token'

    def authenticate_credentials(self, key):
        """
        Authenticate the token and return the user and token
        """
        try:
            token = self.model.objects.select_related('user').get(key=key)
        except self.model.DoesNotExist:
            raise exceptions.AuthenticationFailed('Invalid token.')

        if not token.user.is_active:
            raise exceptions.AuthenticationFailed('User inactive or deleted.')

        return (token.user, token)
