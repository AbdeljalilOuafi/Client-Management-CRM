# AddClientForm Usage Example

## Basic Usage

```tsx
import { AddClientForm } from "@/components/AddClientForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ClientsPage() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false);
    // Optionally refetch clients list or show success message
    console.log("Client added successfully!");
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Add New Client</Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <AddClientForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

## With React Query Invalidation

```tsx
import { useQueryClient } from "@tanstack/react-query";

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    // Invalidate and refetch clients list
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <AddClientForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
```

## Integration with Real API

### Step 1: Update Package Types Query

Replace the mock data in `AddClientForm.tsx`:

```typescript
const { data: packageTypes } = useQuery({
  queryKey: ["packageTypes"],
  queryFn: async () => {
    const response = await fetch("/api/package-types");
    if (!response.ok) throw new Error("Failed to fetch package types");
    return response.json();
  },
});
```

### Step 2: Update Coaches Query

```typescript
const { data: coaches } = useQuery({
  queryKey: ["coaches"],
  queryFn: async () => {
    const response = await fetch("/api/coaches");
    if (!response.ok) throw new Error("Failed to fetch coaches");
    return response.json();
  },
});
```

### Step 3: Add Webhook URL

In the `onSubmit` function, replace:

```typescript
const webhookUrl = "https://your-n8n-instance.com/webhook/add-client";

const response = await fetch(webhookUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
});

if (!response.ok) {
  throw new Error("Failed to submit form");
}
```

## Form Data Structure

When the form is submitted, the data object will have this structure:

```typescript
{
  // Options
  generatePaymentLink: boolean,
  generateContract: boolean,
  
  // Basic Info
  firstName: string,
  lastName: string,
  email: string,
  countryCode: string, // e.g., "+1"
  phone: string,
  dob: string, // DD/MM/YYYY
  
  // Package & Payment
  packageType: string,
  currency: string, // "USD" | "GBP" | "EUR"
  financialAgreement: "pif" | "subscription",
  
  // Conditional PIF fields
  pifPaymentType?: "full" | "instalments",
  pifFullAmount?: string,
  pifMonths?: string,
  monthlyRollingAmount?: string,
  numInstalments?: number,
  instalments?: Array<{
    date: string,
    amount: string
  }>,
  
  // Conditional Subscription fields
  subscriptionInterval?: "monthly" | "weekly",
  firstPaymentType?: "deposit" | "full",
  depositAmount?: string,
  remainderDate?: string,
  
  minimumTerm: string,
  
  // Coaching
  startingToday: "yes" | "no",
  startDate?: string,
  assignedCoach: string,
  checkInDay: string,
  
  // Notes
  notes?: string
}
```

## Validation Rules

- **Required fields**: firstName, lastName, email, phone, dob, packageType, financialAgreement, minimumTerm, startingToday, assignedCoach, checkInDay
- **Email validation**: Must be valid email format
- **Conditional validation**: 
  - If `financialAgreement` is "pif" and `pifPaymentType` is "full", then `pifFullAmount`, `pifMonths`, and `monthlyRollingAmount` are required
  - If `financialAgreement` is "pif" and `pifPaymentType` is "instalments", then instalments array is required
  - If `financialAgreement` is "subscription" and `firstPaymentType` is "deposit", then `depositAmount` and `remainderDate` are required
  - If `startingToday` is "no", then `startDate` is required

## Customization

### Adding New Fields

1. Add to Zod schema:
```typescript
const clientFormSchema = z.object({
  // ... existing fields
  newField: z.string().min(1, "New field is required"),
});
```

2. Add to form UI:
```tsx
<div className="space-y-2">
  <Label htmlFor="newField">New Field *</Label>
  <Input
    id="newField"
    {...register("newField")}
    className={errors.newField ? "border-destructive" : ""}
  />
  {errors.newField && (
    <p className="text-xs text-destructive">{errors.newField.message}</p>
  )}
</div>
```

### Styling Modifications

The component uses Tailwind CSS classes. Common modifications:

- **Change section background**: Replace `bg-muted/50` with your preferred color
- **Adjust form height**: Modify `max-h-[70vh]` in the form element
- **Grid columns**: Change `grid-cols-2` to `grid-cols-1` or `grid-cols-3`
- **Border accent**: Modify `border-l-2 border-primary` for conditional sections

## Testing Checklist

- [ ] Form loads without errors
- [ ] All required fields show validation errors when empty
- [ ] Email validation works correctly
- [ ] PIF full payment option shows correct fields
- [ ] PIF instalments option allows 1-5 instalments
- [ ] Subscription option shows correct fields
- [ ] Deposit option shows deposit amount and remainder date
- [ ] Starting today "No" shows start date field
- [ ] Package types load from API
- [ ] Coaches load from API
- [ ] Form submits successfully
- [ ] Success toast appears
- [ ] onSuccess callback is triggered
- [ ] Form is responsive on mobile devices

## Troubleshooting

### Form doesn't submit
- Check browser console for validation errors
- Ensure all required fields are filled
- Verify webhook URL is correct

### Data not fetching
- Check React Query DevTools
- Verify API endpoints are accessible
- Check network tab for failed requests

### TypeScript errors
- Ensure all dependencies are installed
- Run `npm install` to update packages
- Check tsconfig.json configuration

## Support

For issues or questions:
1. Check the REFACTOR_SUMMARY.md for implementation details
2. Review the inline comments in AddClientForm.tsx
3. Consult React Hook Form documentation: https://react-hook-form.com/
4. Consult Zod documentation: https://zod.dev/
