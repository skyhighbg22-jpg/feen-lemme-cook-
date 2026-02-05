import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Key,
  Users,
  BarChart3,
  Zap,
  Lock,
  Globe,
  ArrowRight,
  CheckCircle2,
  Github,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Key className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Feen</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              href="https://github.com/yethikrishna/feen"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border px-4 py-1.5 text-sm">
            <span className="mr-2">🚀</span>
            <span>Open Source API Key Management</span>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Secure API Key Sharing
            <span className="text-primary"> Made Simple</span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
            Share, manage, and monetize your API keys securely. Built for
            developers, teams, and enterprises who need granular control over
            their API access.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="https://github.com/yethikrishna/feen">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Github className="mr-2 h-4 w-4" /> View on GitHub
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          {[
            { value: "100%", label: "Open Source" },
            { value: "256-bit", label: "Encryption" },
            { value: "99.9%", label: "Uptime SLA" },
            { value: "< 50ms", label: "Avg Latency" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24 border-t">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Everything You Need for API Key Management
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Feen provides a complete solution for managing, sharing, and
            monetizing your API keys with enterprise-grade security.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: "End-to-End Encryption",
              description:
                "Your API keys are encrypted at rest and in transit using AES-256 encryption. Zero-knowledge architecture ensures only you can access your keys.",
            },
            {
              icon: Key,
              title: "Granular Access Control",
              description:
                "Create shared access tokens with custom rate limits, IP restrictions, model whitelists, and expiration dates.",
            },
            {
              icon: Users,
              title: "Team Collaboration",
              description:
                "Invite team members with role-based permissions. Manage keys across your entire organization.",
            },
            {
              icon: BarChart3,
              title: "Usage Analytics",
              description:
                "Track usage, costs, and performance in real-time. Get insights into how your keys are being used.",
            },
            {
              icon: Globe,
              title: "API Marketplace",
              description:
                "Buy and sell API access securely. Monetize your unused capacity or find affordable API access.",
            },
            {
              icon: Zap,
              title: "High Performance",
              description:
                "Built for speed with edge caching and optimized proxy routing. Sub-50ms latency worldwide.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow"
            >
              <feature.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Add Your API Keys",
                description:
                  "Securely store your API keys from OpenAI, Anthropic, Google, and more.",
              },
              {
                step: "2",
                title: "Create Shared Access",
                description:
                  "Generate access tokens with custom limits, restrictions, and expiration.",
              },
              {
                step: "3",
                title: "Share & Monitor",
                description:
                  "Share tokens with your team or sell on the marketplace. Track everything.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade when you need more
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
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
          ].map((plan) => (
            <div
              key={plan.name}
              className={`p-6 rounded-lg border bg-card ${
                plan.popular ? "border-primary shadow-lg scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="text-center mb-4">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="font-semibold text-xl mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold">
                  {plan.price}
                  {plan.price !== "Custom" && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /month
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-2">
                  {plan.description}
                </p>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-24">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Secure Your API Keys?
          </h2>
          <p className="mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of developers who trust Feen for their API key
            management. Open source, secure, and built for scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary">
                Get Started Free
              </Button>
            </Link>
            <Link href="/docs">
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Read Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Key className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">Feen</span>
              </Link>
              <p className="text-muted-foreground text-sm">
                Secure API key sharing made simple. Open source and built with
                love by Yethikrishna R.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-foreground">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/changelog" className="hover:text-foreground">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="https://github.com/yethikrishna/feen"
                    className="hover:text-foreground"
                  >
                    GitHub
                  </Link>
                </li>
                <li>
                  <Link href="/docs/api" className="hover:text-foreground">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-foreground">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-foreground">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Feen. Open source under MIT License.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="https://github.com/yethikrishna/feen"
                className="text-muted-foreground hover:text-foreground"
              >
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
