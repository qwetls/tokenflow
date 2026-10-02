/*
Copyright (C) 2026 TokenFlow contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For licensing information, see the LICENSE and NOTICE files.
*/
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { PublicLayout } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const BASE_URL = 'https://xcloudhost.me/v1'

const curlExample = `curl ${BASE_URL}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "MODEL_ID",
    "messages": [
      { "role": "user", "content": "Hello!" }
    ]
  }'`

const pythonExample = `from openai import OpenAI

client = OpenAI(
    base_url="${BASE_URL}",
    api_key="YOUR_API_KEY",
)

response = client.chat.completions.create(
    model="MODEL_ID",
    messages=[
        {"role": "user", "content": "Hello!"},
    ],
)

print(response.choices[0].message.content)`

const nodeExample = `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${BASE_URL}",
  apiKey: "YOUR_API_KEY",
});

const response = await client.chat.completions.create({
  model: "MODEL_ID",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response.choices[0].message.content);`

const modelsExample = `curl ${BASE_URL}/models \\
  -H "Authorization: Bearer YOUR_API_KEY"`

const piModelsExample = `{
  "providers": {
    "tokenflow": {
      "api": "openai-completions",
      "baseUrl": "https://xcloudhost.me/v1",
      "apiKey": "YOUR_API_KEY",
      "models": [
        { "id": "glm-5.3-flash", "name": "GLM 5.3 Flash" },
        { "id": "deepseek-v4.1-flash", "name": "DeepSeek V4.1 Flash" },
        { "id": "kimi-k2.6", "name": "Kimi K2.6" }
      ]
    }
  }
}`

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className='group relative'>
      <div className='bg-muted/50 flex items-center justify-between rounded-t-lg border border-b-0 px-4 py-2'>
        <span className='text-muted-foreground text-xs font-medium'>
          {language}
        </span>
        <Button
          variant='ghost'
          size='sm'
          className='h-7 gap-1.5 px-2 text-xs'
          onClick={handleCopy}
        >
          {copied ? (
            <Check className='h-3.5 w-3.5 text-green-500' />
          ) : (
            <Copy className='h-3.5 w-3.5' />
          )}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre className='overflow-x-auto rounded-b-lg border bg-zinc-950 p-4 text-sm text-zinc-100 dark:bg-zinc-900'>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className='scroll-mt-24 space-y-4'>
      <h2 className='text-2xl font-semibold tracking-tight'>{title}</h2>
      <div className='text-muted-foreground space-y-4 leading-relaxed'>
        {children}
      </div>
    </section>
  )
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className='bg-muted rounded px-1.5 py-0.5 font-mono text-[0.85em] text-foreground'>
      {children}
    </code>
  )
}

const endpoints: Array<{
  method: string
  path: string
  description: string
}> = [
  {
    method: 'GET',
    path: '/v1/models',
    description: 'List all models available to your API key.',
  },
  {
    method: 'POST',
    path: '/v1/chat/completions',
    description: 'Create a chat completion (OpenAI-compatible).',
  },
  {
    method: 'POST',
    path: '/v1/embeddings',
    description: 'Create text embeddings (OpenAI-compatible).',
  },
  {
    method: 'POST',
    path: '/v1/images/generations',
    description: 'Generate images from a text prompt (OpenAI-compatible).',
  },
]

const errors: Array<{ code: string; meaning: string }> = [
  {
    code: '401',
    meaning: 'Invalid or missing API key. Check the Authorization header.',
  },
  {
    code: '402 / 429',
    meaning: 'Insufficient quota or rate limited. Top up or slow down.',
  },
  {
    code: '400',
    meaning: 'Invalid request parameters. Check the request body.',
  },
  {
    code: '404',
    meaning: 'Unknown model or endpoint. Verify the model ID and path.',
  },
]

export function DocsPage() {
  return (
    <PublicLayout showAuthButtons>
      <div className='mx-auto max-w-4xl space-y-12 pb-16'>
        <div className='space-y-4'>
          <h1 className='text-4xl font-bold tracking-tight'>
            API Documentation
          </h1>
          <p className='text-muted-foreground text-lg leading-relaxed'>
            TokenFlow exposes an OpenAI-compatible API. Any client library or
            tool that works with OpenAI works here — just point it at our base
            URL and use your TokenFlow API key.
          </p>
        </div>

        <Section id='getting-started' title='Getting started'>
          <ol className='list-decimal space-y-3 pl-6'>
            <li>
              <span className='font-medium text-foreground'>
                Create an account.
              </span>{' '}
              Sign up with your GitHub account — it takes less than a minute.
            </li>
            <li>
              <span className='font-medium text-foreground'>
                Create an API key.
              </span>{' '}
              Open the dashboard, go to API Keys, and create a new key. Copy it
              immediately — it is shown only once.
            </li>
            <li>
              <span className='font-medium text-foreground'>
                Make your first request.
              </span>{' '}
              Use the examples below with your key. New accounts start with{' '}
              <InlineCode>0</InlineCode> quota — top up with a redeem code on
              the Top Up page to get started.
            </li>
          </ol>
        </Section>

        <Section id='base-url-auth' title='Base URL & authentication'>
          <p>
            All API requests go to the base URL below. The{' '}
            <InlineCode>/v1</InlineCode> suffix is required — requests without
            it will fail.
          </p>
          <CodeBlock code={BASE_URL} language='text' />
          <p>
            Authenticate with your API key in the{' '}
            <InlineCode>Authorization</InlineCode> header as a Bearer token. Use
            the key exactly as shown in the dashboard — do not add an{' '}
            <InlineCode>sk-</InlineCode> prefix or modify it in any way.
          </p>
          <CodeBlock
            code='Authorization: Bearer YOUR_API_KEY'
            language='http'
          />
        </Section>

        <Section id='endpoints' title='Endpoints'>
          <p>
            The API follows the OpenAI format. Replace{' '}
            <InlineCode>MODEL_ID</InlineCode> with an ID from{' '}
            <InlineCode>GET /v1/models</InlineCode>.
          </p>
          <Card>
            <CardContent className='divide-y p-0'>
              {endpoints.map((endpoint) => (
                <div
                  key={endpoint.path}
                  className='flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:gap-4'
                >
                  <Badge
                    variant={
                      endpoint.method === 'GET' ? 'secondary' : 'default'
                    }
                    className='w-fit shrink-0 font-mono'
                  >
                    {endpoint.method}
                  </Badge>
                  <code className='font-mono text-sm font-medium text-foreground'>
                    {endpoint.path}
                  </code>
                  <span className='text-sm sm:ml-auto'>
                    {endpoint.description}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </Section>

        <Section id='examples' title='Code examples'>
          <p>A basic chat completion request in three flavors:</p>
          <Tabs defaultValue='curl' className='w-full'>
            <TabsList>
              <TabsTrigger value='curl'>cURL</TabsTrigger>
              <TabsTrigger value='python'>Python</TabsTrigger>
              <TabsTrigger value='node'>Node.js</TabsTrigger>
            </TabsList>
            <TabsContent value='curl'>
              <CodeBlock code={curlExample} language='bash' />
            </TabsContent>
            <TabsContent value='python'>
              <CodeBlock code={pythonExample} language='python' />
            </TabsContent>
            <TabsContent value='node'>
              <CodeBlock code={nodeExample} language='javascript' />
            </TabsContent>
          </Tabs>
          <p>
            To see which models you can use with your key, call{' '}
            <InlineCode>GET /v1/models</InlineCode>:
          </p>
          <CodeBlock code={modelsExample} language='bash' />
        </Section>

        <Section id='pi-agent' title='Using TokenFlow with Pi Agent'>
          <p>
            Pi is an open-source AI coding agent that runs in your terminal.
            You can register TokenFlow as a custom OpenAI-compatible provider,
            so Pi runs on your TokenFlow quota.
          </p>
          <ol className='list-decimal space-y-3 pl-6'>
            <li>
              <span className='font-medium text-foreground'>
                Install Pi.
              </span>
              <CodeBlock
                code='curl -fsSL https://pi.dev/install.sh | sh'
                language='bash'
              />
            </li>
            <li>
              <span className='font-medium text-foreground'>
                Create a TokenFlow API key.
              </span>{' '}
              Open the dashboard, go to API Keys, and create a new key.
            </li>
            <li>
              <span className='font-medium text-foreground'>
                Register TokenFlow as a provider.
              </span>{' '}
              Create or edit <InlineCode>~/.pi/agent/models.json</InlineCode>{' '}
              and add the block below, replacing{' '}
              <InlineCode>YOUR_API_KEY</InlineCode> with your key. You can also
              use Pi&apos;s &ldquo;Add new provider&rdquo; screen with the same
              base URL and key, choosing the chat completions API type.
              <CodeBlock code={piModelsExample} language='json' />
            </li>
            <li>
              <span className='font-medium text-foreground'>Start Pi.</span>{' '}
              Run <InlineCode>pi --model tokenflow/glm-5.3-flash</InlineCode>,
              or pick the model with <InlineCode>/model</InlineCode> inside Pi.
            </li>
          </ol>
          <ul className='list-disc space-y-2 pl-6'>
            <li>
              The <InlineCode>/v1</InlineCode> suffix in{' '}
              <InlineCode>baseUrl</InlineCode> is required.
            </li>
            <li>
              <InlineCode>GET /v1/models</InlineCode> requires authentication —
              if Pi shows &ldquo;0 models&rdquo; for the provider, the API key
              is missing or not being sent. Save the key in the provider
              settings, or declare the models explicitly in{' '}
              <InlineCode>models.json</InlineCode> as shown above.
            </li>
            <li>
              Model IDs change over time — check the dashboard or call{' '}
              <InlineCode>GET /v1/models</InlineCode> for the current list.
            </li>
            <li>
              Every request deducts from your TokenFlow quota, like any other
              API call.
            </li>
          </ul>
        </Section>

        <Section id='quota-billing' title='Quota & billing'>
          <ul className='list-disc space-y-2 pl-6'>
            <li>
              Usage is deducted from your quota balance at a rate of{' '}
              <InlineCode>$1 = 500,000 quota</InlineCode>. Each model consumes
              quota according to its own pricing, shown on the pricing page.
            </li>
            <li>
              Top up your balance with a redeem code on the Top Up page in the
              dashboard — the quota is added instantly.
            </li>
            <li>
              Failed requests do not consume quota. Only successful responses
              are billed.
            </li>
          </ul>
        </Section>

        <Section id='errors' title='Errors'>
          <p>
            Errors use standard HTTP status codes with a JSON body describing
            the problem:
          </p>
          <Card>
            <CardContent className='divide-y p-0'>
              {errors.map((error) => (
                <div
                  key={error.code}
                  className='flex flex-col gap-1 px-5 py-4 sm:flex-row sm:gap-4'
                >
                  <code className='w-24 shrink-0 font-mono text-sm font-semibold text-foreground'>
                    {error.code}
                  </code>
                  <span className='text-sm'>{error.meaning}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </Section>

        <Card>
          <CardHeader>
            <CardTitle>Works with your existing tools</CardTitle>
          </CardHeader>
          <CardContent className='text-muted-foreground text-sm leading-relaxed'>
            Because the API is OpenAI-compatible, you can keep using the
            official <InlineCode>openai</InlineCode> SDKs, LangChain, or any
            other OpenAI-based tooling. The only changes needed are{' '}
            <InlineCode>baseURL</InlineCode> and <InlineCode>apiKey</InlineCode>.
            The interactive Playground in the dashboard is a good place to
            experiment before writing code.
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}
