import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle2, Zap, ArrowRight } from "lucide-react";

async function getSubscription(userId: string) {
  return db.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
  });
}

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "3 API keys",
      "5 shared tokens",
      "1,000 requests/day",
      "7-day analytics",
      "Community support",
    ],
    current: true,
  },
  {
    name: "Pro",
    price: "$19",
    description: "For power users and small teams",
    features: [
      "Unlimited API keys",
      "Unlimited shared tokens",
      "100,000 requests/day",
      "90-day analytics",
      "Priority support",
      "Team collaboration",
      "Custom rate limits",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations",
    features: [
      "Everything in Pro",
      "Unlimited requests",
      "365-day analytics",
      "SSO & SAML",
      "Dedicated support",
      "SLA guarantee",
      "Custom integrations",
    ],
  },
];

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const subscription = await getSubscription(session.user.id);
  const currentPlan = subscription?.plan || "FREE";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">
                  {currentPlan.charAt(0) + currentPlan.slice(1).toLowerCase()} Plan
                </p>
                <p className="text-sm text-muted-foreground">
                  {subscription?.currentPeriodEnd
                    ? `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : "No expiration"}
                </p>
              </div>
            </div>
            <Badge variant={currentPlan === "FREE" ? "secondary" : "default"}>
              {currentPlan}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.name.toUpperCase() === currentPlan;
            return (
              <Card
                key={plan.name}
                className={`${plan.popular ? "border-primary shadow-lg" : ""}`}
              >
                {plan.popular && (
                  <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium rounded-t-lg">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {isCurrent && (
                      <Badge variant="outline">Current</Badge>
                    )}
                  </CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.price !== "Custom" && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                    disabled={isCurrent}
                  >
                    {isCurrent ? (
                      "Current Plan"
                    ) : plan.price === "Custom" ? (
                      "Contact Sales"
                    ) : (
                      <>
                        Upgrade <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>Your usage for this billing period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">API Keys</span>
                <span className="text-sm text-muted-foreground">2 / 3</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-2/3 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Shared Tokens</span>
                <span className="text-sm text-muted-foreground">3 / 5</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-3/5 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Daily Requests</span>
                <span className="text-sm text-muted-foreground">523 / 1,000</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-1/2 rounded-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-16 bg-muted rounded flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No payment method</p>
                <p className="text-sm text-muted-foreground">
                  Add a payment method to upgrade
                </p>
              </div>
            </div>
            <Button variant="outline">
              <Zap className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
