import { CreditCard, Check } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";

const plans = [
  { name: "Starter", price: "$29/mo", features: ["5 team members", "100 customers", "Basic reports"], current: false },
  { name: "Pro", price: "$79/mo", features: ["20 team members", "Unlimited customers", "Advanced reports", "Priority support"], current: true },
  { name: "Enterprise", price: "$199/mo", features: ["Unlimited team", "Unlimited everything", "Custom branding", "Dedicated support", "API access"], current: false },
];

export default function BillingPage() {
  return (
    <div>
      <PageHeader title="Billing" description="Manage your subscription and payment details." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xl font-bold">Pro Plan</p>
              <p className="text-muted-foreground text-sm">$79/month · Renews Apr 26, 2026</p>
            </div>
            <StatusBadge status="Active" />
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.current ? "ring-2 ring-primary" : ""}>
            <CardContent className="p-5">
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="text-2xl font-bold mt-1">{plan.price}</p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-4" variant={plan.current ? "secondary" : "default"} disabled={plan.current}>
                {plan.current ? "Current Plan" : "Upgrade"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
