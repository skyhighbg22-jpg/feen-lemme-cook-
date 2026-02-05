import { PrismaClient, ApiProvider, PlanType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create demo user
  const hashedPassword = await bcrypt.hash("demo123456", 12);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@feen.dev" },
    update: {},
    create: {
      email: "demo@feen.dev",
      name: "Demo User",
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  console.log("✅ Created demo user:", demoUser.email);

  // Create demo subscription
  await prisma.subscription.upsert({
    where: { id: "demo-subscription" },
    update: {},
    create: {
      id: "demo-subscription",
      userId: demoUser.id,
      plan: PlanType.PRO,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Created demo subscription");

  // Create demo team
  const demoTeam = await prisma.team.upsert({
    where: { slug: "demo-team" },
    update: {},
    create: {
      name: "Demo Team",
      slug: "demo-team",
      description: "A demo team for testing",
      ownerId: demoUser.id,
    },
  });

  console.log("✅ Created demo team:", demoTeam.name);

  // Add user as team owner
  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: demoTeam.id,
        userId: demoUser.id,
      },
    },
    update: {},
    create: {
      teamId: demoTeam.id,
      userId: demoUser.id,
      role: "OWNER",
    },
  });

  console.log("✅ Added demo user to team");

  // Create sample API keys (with fake encrypted values for demo)
  const providers = [
    { provider: ApiProvider.OPENAI, name: "OpenAI Production", prefix: "sk-...demo1" },
    { provider: ApiProvider.ANTHROPIC, name: "Anthropic Claude", prefix: "sk-ant-...demo2" },
    { provider: ApiProvider.GOOGLE, name: "Google AI", prefix: "AIza...demo3" },
  ];

  for (const { provider, name, prefix } of providers) {
    await prisma.apiKey.upsert({
      where: { id: `demo-key-${provider.toLowerCase()}` },
      update: {},
      create: {
        id: `demo-key-${provider.toLowerCase()}`,
        name,
        description: `Demo ${provider} API key for testing`,
        provider,
        encryptedKey: "DEMO_ENCRYPTED_KEY_PLACEHOLDER",
        keyHash: `hash_${provider.toLowerCase()}_demo`,
        keyPrefix: prefix,
        userId: demoUser.id,
        teamId: demoTeam.id,
        rateLimit: 1000,
        dailyLimit: 10000,
      },
    });
  }

  console.log("✅ Created demo API keys");

  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
