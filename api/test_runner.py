"""
Custom test runner that doesn't create a test database.
Since our models are managed=False, we use the actual database.
"""
from django.test.runner import DiscoverRunner


class NoDbTestRunner(DiscoverRunner):
    """Test runner that uses existing database without creating a test DB"""
    
    def setup_databases(self, **kwargs):
        """Override to skip test database creation"""
        # Return empty list to indicate no test databases created
        return []
    
    def teardown_databases(self, old_config, **kwargs):
        """Override to skip test database teardown"""
        pass
