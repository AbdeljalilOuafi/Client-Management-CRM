'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function ConnectStripeButton() {
  const { toast } = useToast();

  const handleConnectStripe = () => {
    // Get account ID from localStorage (set during login)
    const accountId = localStorage.getItem('accountId');
    
    if (!accountId) {
      toast({
        title: 'Authentication Required',
        description: 'Unable to retrieve account information. Please log in again.',
        variant: 'destructive',
      });
      return;
    }
    
    // Stripe Connect OAuth parameters
    const stripeClientId = process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID || 'ca_YOUR_CLIENT_ID';
    // Backend callback URL - backend will process and redirect back to frontend
    const redirectUri = 'https://stripe.fithq.ai/api/stripe/callback/';
    
    // Build Stripe OAuth URL
    const stripeOAuthUrl = new URL('https://connect.stripe.com/oauth/authorize');
    stripeOAuthUrl.searchParams.append('response_type', 'code');
    stripeOAuthUrl.searchParams.append('client_id', stripeClientId);
    stripeOAuthUrl.searchParams.append('scope', 'read_write');
    stripeOAuthUrl.searchParams.append('redirect_uri', redirectUri);
    stripeOAuthUrl.searchParams.append('state', accountId); // Pass account_id as state
    
    // Redirect to Stripe
    window.location.href = stripeOAuthUrl.toString();
  };
  
  return (
    <Button onClick={handleConnectStripe} className="gap-2 w-full">
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
      </svg>
      Connect with Stripe
    </Button>
  );
}
