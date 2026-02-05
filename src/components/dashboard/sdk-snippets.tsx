"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Terminal, Code2 } from "lucide-react";
import { toast } from "sonner";

interface SDKSnippetsProps {
  accessToken: string;
  baseUrl?: string;
}

type Language = "curl" | "python" | "nodejs" | "typescript";

const languageConfig: Record<
  Language,
  { name: string; icon: React.ReactNode; color: string }
> = {
  curl: { name: "cURL", icon: <Terminal className="h-4 w-4" />, color: "bg-green-500" },
  python: { name: "Python", icon: <Code2 className="h-4 w-4" />, color: "bg-blue-500" },
  nodejs: { name: "Node.js", icon: <Code2 className="h-4 w-4" />, color: "bg-green-600" },
  typescript: { name: "TypeScript", icon: <Code2 className="h-4 w-4" />, color: "bg-blue-600" },
};

export function SDKSnippets({ accessToken, baseUrl = "https://api.feen.dev" }: SDKSnippetsProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("curl");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const snippets = generateSnippets(accessToken, baseUrl);

  const copyToClipboard = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Language Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(languageConfig) as Language[]).map((lang) => (
          <Button
            key={lang}
            variant={selectedLanguage === lang ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedLanguage(lang)}
            className="gap-2"
          >
            {languageConfig[lang].icon}
            {languageConfig[lang].name}
          </Button>
        ))}
      </div>

      {/* Code Snippets */}
      <div className="space-y-4">
        {snippets[selectedLanguage].map((snippet, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{snippet.title}</CardTitle>
                  <CardDescription>{snippet.description}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(snippet.code, index)}
                >
                  {copiedIndex === index ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{snippet.code}</code>
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Installation Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Installation</CardTitle>
          <CardDescription>
            Install the SDK for your language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
            <code>{getInstallCommand(selectedLanguage)}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

interface Snippet {
  title: string;
  description: string;
  code: string;
}

function generateSnippets(
  token: string,
  baseUrl: string
): Record<Language, Snippet[]> {
  const maskedToken = token.slice(0, 12) + "..." + token.slice(-4);

  return {
    curl: [
      {
        title: "Chat Completion",
        description: "Send a chat completion request",
        code: `curl ${baseUrl}/api/proxy/v1/chat/completions \\
  -H "Authorization: Bearer ${maskedToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'`,
      },
      {
        title: "Create Embeddings",
        description: "Generate text embeddings",
        code: `curl ${baseUrl}/api/proxy/v1/embeddings \\
  -H "Authorization: Bearer ${maskedToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "text-embedding-ada-002",
    "input": "The quick brown fox jumps over the lazy dog"
  }'`,
      },
      {
        title: "List Models",
        description: "Get available models",
        code: `curl ${baseUrl}/api/proxy/v1/models \\
  -H "Authorization: Bearer ${maskedToken}"`,
      },
    ],
    python: [
      {
        title: "Chat Completion",
        description: "Send a chat completion request using OpenAI SDK",
        code: `from openai import OpenAI

client = OpenAI(
    api_key="${maskedToken}",
    base_url="${baseUrl}/api/proxy/v1"
)

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "Hello, how are you?"}
    ]
)

print(response.choices[0].message.content)`,
      },
      {
        title: "Streaming Response",
        description: "Stream chat completion responses",
        code: `from openai import OpenAI

client = OpenAI(
    api_key="${maskedToken}",
    base_url="${baseUrl}/api/proxy/v1"
)

stream = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "Write a short poem"}
    ],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")`,
      },
      {
        title: "Create Embeddings",
        description: "Generate text embeddings",
        code: `from openai import OpenAI

client = OpenAI(
    api_key="${maskedToken}",
    base_url="${baseUrl}/api/proxy/v1"
)

response = client.embeddings.create(
    model="text-embedding-ada-002",
    input="The quick brown fox jumps over the lazy dog"
)

embedding = response.data[0].embedding
print(f"Embedding dimension: {len(embedding)}")`,
      },
    ],
    nodejs: [
      {
        title: "Chat Completion",
        description: "Send a chat completion request using OpenAI SDK",
        code: `const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: '${maskedToken}',
  baseURL: '${baseUrl}/api/proxy/v1'
});

async function chat() {
  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'user', content: 'Hello, how are you?' }
    ]
  });

  console.log(response.choices[0].message.content);
}

chat();`,
      },
      {
        title: "Streaming Response",
        description: "Stream chat completion responses",
        code: `const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: '${maskedToken}',
  baseURL: '${baseUrl}/api/proxy/v1'
});

async function streamChat() {
  const stream = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'user', content: 'Write a short poem' }
    ],
    stream: true
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(content);
  }
}

streamChat();`,
      },
    ],
    typescript: [
      {
        title: "Chat Completion",
        description: "Send a chat completion request with TypeScript",
        code: `import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '${maskedToken}',
  baseURL: '${baseUrl}/api/proxy/v1'
});

async function chat(): Promise<void> {
  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'user', content: 'Hello, how are you?' }
    ]
  });

  console.log(response.choices[0].message.content);
}

chat();`,
      },
      {
        title: "With Request Signing (Secure)",
        description: "Use HMAC request signing for enhanced security",
        code: `import OpenAI from 'openai';
import crypto from 'crypto';

const TOKEN_ID = '${maskedToken}';
const SIGNING_SECRET = 'your-signing-secret';

function signRequest(method: string, path: string, body?: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');

  const signatureBase = [timestamp, nonce, method, path, body || '', TOKEN_ID].join('\\n');
  const signature = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(signatureBase)
    .digest('hex');

  return {
    'X-Feen-Timestamp': timestamp.toString(),
    'X-Feen-Signature': signature,
    'X-Feen-Nonce': nonce
  };
}

// Use with fetch for signed requests
const headers = signRequest('POST', '/v1/chat/completions', JSON.stringify(body));`,
      },
    ],
  };
}

function getInstallCommand(language: Language): string {
  switch (language) {
    case "curl":
      return "# cURL is usually pre-installed on most systems\n# On Windows, you can use PowerShell or install via chocolatey:\nchoco install curl";
    case "python":
      return "pip install openai";
    case "nodejs":
      return "npm install openai";
    case "typescript":
      return "npm install openai\nnpm install -D @types/node typescript";
    default:
      return "";
  }
}
