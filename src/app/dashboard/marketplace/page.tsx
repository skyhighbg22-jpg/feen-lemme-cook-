import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Store, Search, Star, TrendingUp, Zap } from "lucide-react";

const providerColors: Record<string, string> = {
  OPENAI: "bg-green-500",
  ANTHROPIC: "bg-orange-500",
  GOOGLE: "bg-blue-500",
  AZURE_OPENAI: "bg-cyan-500",
  MISTRAL: "bg-yellow-500",
  GROQ: "bg-pink-500",
};

async function getMarketplaceListings() {
  return db.marketplaceListing.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: "desc" }, { totalSales: "desc" }],
    take: 20,
    include: {
      seller: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });
}

export default async function MarketplacePage() {
  const listings = await getMarketplaceListings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            Buy and sell API access securely
          </p>
        </div>
        <Button>
          <Store className="mr-2 h-4 w-4" />
          List Your Key
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search marketplace..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">OpenAI</Button>
        <Button variant="outline">Anthropic</Button>
        <Button variant="outline">Google</Button>
        <Button variant="outline">All Providers</Button>
      </div>

      {/* Featured Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Featured Listings
        </h2>

        {listings.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`h-8 w-8 rounded ${providerColors[listing.provider] || "bg-gray-500"} flex items-center justify-center`}>
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    {listing.isFeatured && (
                      <Badge variant="secondary">Featured</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-2">{listing.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {listing.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Models */}
                    <div className="flex flex-wrap gap-1">
                      {listing.models.slice(0, 3).map((model) => (
                        <Badge key={model} variant="outline" className="text-xs">
                          {model}
                        </Badge>
                      ))}
                      {listing.models.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{listing.models.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span>{Number(listing.rating).toFixed(1)}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {listing.totalSales} sales
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold">
                          ${Number(listing.pricePerRequest).toFixed(4)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /request
                        </span>
                      </div>
                      <Button size="sm">Purchase</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Store className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Marketplace Coming Soon</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-4">
                The API marketplace is being set up. Soon you&apos;ll be able to buy
                and sell API access securely.
              </p>
              <Button>
                <Store className="mr-2 h-4 w-4" />
                Be First to List
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
