/**
 * GoHighLevel Permissions API
 * Handles sending permissions data to webhook
 */

export interface GHLPermissionsPayload {
  staff_id: string | number;
  needsGHLAccess: boolean;
  permissions: Record<string, boolean>;
}

/**
 * Send GoHighLevel permissions to webhook
 * @param payload - The permissions payload
 * @param webhookUrl - The webhook URL (placeholder for now)
 */
export const sendGHLPermissions = async (
  payload: GHLPermissionsPayload,
  webhookUrl: string = 'https://webhook.url/placeholder'
): Promise<void> => {
  try {
    console.log('[GHL API] Sending permissions to webhook:', webhookUrl);
    console.log('[GHL API] Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.statusText}`);
    }

    console.log('[GHL API] Permissions sent successfully');
  } catch (error) {
    console.error('[GHL API] Error sending permissions:', error);
    // Don't throw - we don't want to fail the staff creation if webhook fails
    // Just log the error for now
  }
};

/**
 * Build the GHL permissions payload from form data
 */
export const buildGHLPayload = (
  staffId: string | number,
  permissions: Record<string, boolean>
): GHLPermissionsPayload => {
  return {
    staff_id: staffId,
    needsGHLAccess: true,
    permissions,
  };
};
