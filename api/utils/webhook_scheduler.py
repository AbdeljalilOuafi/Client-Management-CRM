"""
Webhook Scheduler Integration
Manages recurring webhooks via external scheduler API at https://schedules.onsync.ai
"""

import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# Day name to cron number mapping (0=Sunday, 1=Monday, etc.)
DAY_TO_CRON = {
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
    'sunday': 0,
}


def create_schedule_webhooks(schedule):
    """
    Creates webhooks with external scheduler for a CheckInSchedule.
    Returns list of webhook IDs created.
    
    Args:
        schedule: CheckInSchedule instance
    
    Returns:
        list: Webhook IDs from scheduler
    
    Raises:
        requests.RequestException: If webhook creation fails
    """
    webhook_ids = []
    crm_webhook_url = f"{settings.BACKEND_URL}/api/internal/checkin-trigger/"
    
    try:
        if schedule.schedule_type == 'SAME_DAY':
            # Create single webhook for all clients on same day
            webhook_id = _create_single_webhook(
                schedule=schedule,
                day_name=schedule.day_of_week,
                crm_url=crm_webhook_url,
                day_filter=None  # No filter - send to all clients
            )
            webhook_ids.append(webhook_id)
            logger.info(f"Created SAME_DAY webhook {webhook_id} for schedule {schedule.id}")
        
        elif schedule.schedule_type == 'INDIVIDUAL_DAYS':
            # Create 7 webhooks (one per day of week)
            for day_name, day_num in DAY_TO_CRON.items():
                webhook_id = _create_single_webhook(
                    schedule=schedule,
                    day_name=day_name,
                    crm_url=crm_webhook_url,
                    day_filter=day_name  # Filter clients by their checkin_day
                )
                webhook_ids.append(webhook_id)
            
            logger.info(f"Created {len(webhook_ids)} INDIVIDUAL_DAYS webhooks for schedule {schedule.id}")
        
        # Store webhook IDs on schedule
        schedule.webhook_job_ids = webhook_ids
        schedule.save(update_fields=['webhook_job_ids'])
        
        return webhook_ids
    
    except requests.RequestException as e:
        logger.error(f"Failed to create webhooks for schedule {schedule.id}: {str(e)}")
        # Cleanup any created webhooks
        for webhook_id in webhook_ids:
            try:
                cancel_webhook(webhook_id)
            except:
                pass
        raise


def _create_single_webhook(schedule, day_name, crm_url, day_filter):
    """
    Creates a single recurring webhook via external scheduler API.
    
    Args:
        schedule: CheckInSchedule instance
        day_name: Name of day (e.g., 'monday')
        crm_url: CRM endpoint URL to call
        day_filter: Day to filter clients by (or None for all clients)
    
    Returns:
        int: Webhook ID from scheduler
    """
    day_num = DAY_TO_CRON[day_name]
    cron_expression = f"{schedule.time.minute} {schedule.time.hour} * * {day_num}"
    
    # Build webhook name
    if day_filter:
        webhook_name = f"CheckIn: {schedule.form.title} ({day_name.title()})"
    else:
        webhook_name = f"CheckIn: {schedule.form.title} (All Clients)"
    
    # Payload to send to CRM when webhook triggers
    # Include webhook secret in payload since CronHooks may not support custom headers
    webhook_payload = {
        'schedule_id': str(schedule.id),
        'day_filter': day_filter,
        'webhook_secret': settings.WEBHOOK_SECRET  # Include secret in payload for verification
    }
    
    # Create webhook via external API
    webhook_create_url = f"{settings.WEBHOOK_SCHEDULER_URL}/api/webhooks/"
    webhook_request_data = {
        'name': webhook_name,
        'url': crm_url,
        'http_method': 'POST',
        'schedule_type': 'recurring',
        'cron_expression': cron_expression,
        'timezone': schedule.timezone,
        'payload': webhook_payload
    }
    
    logger.info(f"Creating webhook at {webhook_create_url}")
    logger.debug(f"Webhook request data: {webhook_request_data}")
    
    try:
        response = requests.post(
            webhook_create_url,
            headers={
                'Authorization': f'Token {settings.WEBHOOK_SCHEDULER_TOKEN}',
                'Content-Type': 'application/json'
            },
            json=webhook_request_data,
            timeout=30
        )
        
        response.raise_for_status()
        webhook_data = response.json()
        
        logger.info(f"Webhook creation response: {webhook_data}")
        
        # Try to extract ID from response (could be 'id', 'webhook_id', or in headers)
        webhook_id = webhook_data.get('id') or webhook_data.get('webhook_id')
        
        if not webhook_id:
            # Check if ID is in Location header
            location = response.headers.get('Location', '')
            if location:
                # Extract ID from URL like /api/webhooks/123/
                parts = location.rstrip('/').split('/')
                if parts:
                    webhook_id = parts[-1]
        
        if not webhook_id:
            # Fallback: Query the webhook by name since CronHooks doesn't return ID
            logger.warning("Webhook ID not in response, querying by name as fallback")
            try:
                list_response = requests.get(
                    f"{settings.WEBHOOK_SCHEDULER_URL}/api/webhooks/",
                    headers={
                        'Authorization': f'Token {settings.WEBHOOK_SCHEDULER_TOKEN}'
                    },
                    params={'name': webhook_name},
                    timeout=10
                )
                list_response.raise_for_status()
                webhooks = list_response.json()
                
                if webhooks and len(webhooks) > 0:
                    # Get the most recently created webhook with this name
                    webhook_id = webhooks[0].get('id') if isinstance(webhooks, list) else webhooks.get('results', [{}])[0].get('id')
                
                if not webhook_id:
                    logger.error(f"Could not find webhook after creation: {webhooks}")
                    raise ValueError("Webhook created but could not retrieve ID")
                    
            except Exception as e:
                logger.error(f"Failed to query webhook after creation: {str(e)}")
                raise ValueError("Webhook created but no ID returned")
        
        logger.info(f"Successfully created webhook with ID: {webhook_id}")
        return webhook_id
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to create webhook: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response status: {e.response.status_code}")
            logger.error(f"Response body: {e.response.text}")
        raise


def cancel_schedule_webhooks(schedule):
    """
    Cancels all webhooks for a schedule (does not delete them).
    
    Args:
        schedule: CheckInSchedule instance
    """
    if not schedule.webhook_job_ids:
        return
    
    for webhook_id in schedule.webhook_job_ids:
        try:
            cancel_webhook(webhook_id)
            logger.info(f"Canceled webhook {webhook_id} for schedule {schedule.id}")
        except requests.RequestException as e:
            logger.error(f"Failed to cancel webhook {webhook_id}: {str(e)}")
            # Continue with other webhooks


def cancel_webhook(webhook_id):
    """
    Cancels a single webhook via external scheduler API.
    
    Args:
        webhook_id: Webhook ID from scheduler
    """
    response = requests.post(
        f"{settings.WEBHOOK_SCHEDULER_URL}/api/webhooks/{webhook_id}/cancel/",
        headers={
            'Authorization': f'Token {settings.WEBHOOK_SCHEDULER_TOKEN}'
        },
        timeout=10
    )
    response.raise_for_status()


def delete_schedule_webhooks(schedule):
    """
    Permanently deletes all webhooks for a schedule.
    
    Args:
        schedule: CheckInSchedule instance
    """
    if not schedule.webhook_job_ids:
        return
    
    for webhook_id in schedule.webhook_job_ids:
        try:
            delete_webhook(webhook_id)
            logger.info(f"Deleted webhook {webhook_id} for schedule {schedule.id}")
        except requests.RequestException as e:
            logger.error(f"Failed to delete webhook {webhook_id}: {str(e)}")
            # Continue with other webhooks


def delete_webhook(webhook_id):
    """
    Permanently deletes a single webhook via external scheduler API.
    
    Args:
        webhook_id: Webhook ID from scheduler
    """
    response = requests.delete(
        f"{settings.WEBHOOK_SCHEDULER_URL}/api/webhooks/{webhook_id}/",
        headers={
            'Authorization': f'Token {settings.WEBHOOK_SCHEDULER_TOKEN}'
        },
        timeout=10
    )
    response.raise_for_status()


def update_schedule_webhooks(schedule):
    """
    Updates schedule webhooks by canceling old ones and creating new ones.
    
    Args:
        schedule: CheckInSchedule instance
    """
    # Cancel existing webhooks
    cancel_schedule_webhooks(schedule)
    
    # Create new webhooks with updated configuration
    return create_schedule_webhooks(schedule)
