"use client";

import { Payment } from "@/lib/api/payments";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ExpandedPaymentRowProps {
  payment: Payment;
}

export const ExpandedPaymentRow = ({ payment }: ExpandedPaymentRowProps) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'succeeded':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'incomplete':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'disputed':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number, currency?: string) => {
    return `${currency || 'USD'} ${Number(amount).toFixed(2)}`;
  };

  return (
    <Card className="border-l-4 border-l-primary bg-muted/30">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Payment Details Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Payment Details
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Payment ID</p>
                <p className="font-mono text-sm font-medium">{payment.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Amount</p>
                <p className="text-lg font-bold">{formatCurrency(payment.amount, payment.paid_currency)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Currency</p>
                <p className="font-medium">{payment.paid_currency || '-'}</p>
              </div>
              {payment.account_currency && payment.account_currency !== payment.paid_currency && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Account Currency</p>
                    <p className="font-medium">{payment.account_currency}</p>
                  </div>
                  {payment.exchange_rate && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Exchange Rate</p>
                      <p className="font-medium font-mono">{Number(payment.exchange_rate).toFixed(6)}</p>
                    </div>
                  )}
                </>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge className={getStatusColor(payment.status)}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Payment Date</p>
                <p className="font-medium">{formatDate(payment.payment_date)}</p>
              </div>
            </div>
          </div>

          {/* Account Info Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Account Info
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                <p className="font-medium">{payment.payment_method || '-'}</p>
              </div>
              {payment.native_account_currency && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Native Account Currency</p>
                  <p className="font-medium">{payment.native_account_currency}</p>
                </div>
              )}
              {payment.failure_reason && payment.status === 'failed' && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">Failure Reason</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{payment.failure_reason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Client Info Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Client Info
            </h4>
            <div className="space-y-3">
              {payment.client_name && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Client Name</p>
                  <p className="font-medium">{payment.client_name}</p>
                </div>
              )}
              {payment.client_id && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Client ID</p>
                  <p className="font-mono text-sm">{payment.client_id}</p>
                </div>
              )}
              {payment.client_email && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="font-medium text-sm">{payment.client_email}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
};
