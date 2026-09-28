/*
Copyright (C) 2023-2026 QuantumNous

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

For commercial licensing, please contact support@quantumnous.com
*/
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

import { HeroTerminalDemo } from '../hero-terminal-demo'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

const SUPPORTED_MODELS = [
  'OpenAI',
  'Claude',
  'Gemini',
  'DeepSeek',
  'Qwen',
  'Llama',
  'Mistral',
  'Grok',
  'Kimi',
  'GLM',
]

export function Hero(props: HeroProps) {
  const { t } = useTranslation()

  return (
    <section className='relative z-10 overflow-hidden'>
      <div className='tf-glow' aria-hidden />

      <div className='mx-auto max-w-6xl px-6 pt-28 pb-16 md:pt-36 md:pb-24'>
        <div className='mx-auto max-w-3xl text-center'>
          <p className='text-muted-foreground mb-5 font-mono text-xs tracking-widest uppercase'>
            TokenFlow
          </p>
          <h1 className='text-4xl leading-[1.08] font-bold tracking-tight text-balance md:text-6xl'>
            {t('One key.')}{' '}
            <span className='text-muted-foreground/60'>
              {t('Every model.')}
            </span>
          </h1>
          <p className='text-muted-foreground mx-auto mt-6 max-w-xl text-base leading-relaxed text-pretty md:text-lg'>
            {t(
              'Plug in one API key and call every model — GPT, Claude, Gemini, DeepSeek — from a single endpoint. Pay only for the tokens you burn. No plans, no lock-in, no surprises.'
            )}
          </p>

          <div className='mt-9 flex flex-wrap items-center justify-center gap-3'>
            {props.isAuthenticated ? (
              <Button
                className='group h-11 rounded-full px-6 text-sm font-medium'
                render={<Link to='/dashboard' />}
              >
                {t('Go to Dashboard')}
                <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
              </Button>
            ) : (
              <Button
                className='group h-11 rounded-full px-6 text-sm font-medium'
                render={<Link to='/sign-up' />}
              >
                {t('Get Started')}
                <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
              </Button>
            )}
            <Button
              variant='outline'
              className='border-border h-11 rounded-full bg-background/60 px-6 text-sm font-medium backdrop-blur-sm'
              render={<Link to='/pricing' />}
            >
              {t('View Pricing')}
            </Button>
          </div>
        </div>

        {/* Product as hero — live terminal card */}
        <div className='landing-animate-fade-up relative mx-auto mt-14 max-w-4xl opacity-0 md:mt-16'>
          <div
            aria-hidden
            className='absolute -inset-x-8 -top-8 bottom-16 -z-10 rounded-[3rem] bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,oklch(0.7_0.12_250/12%),transparent_70%)] blur-2xl'
          />
          <div className='tf-card overflow-hidden rounded-2xl p-1.5'>
            <HeroTerminalDemo className='w-full' />
          </div>
        </div>

        {/* Supported models strip */}
        <div className='mt-12 md:mt-14'>
          <p className='text-muted-foreground/70 mb-4 text-center text-xs font-medium tracking-wider uppercase'>
            {t('Works with the models you already use')}
          </p>
          <div className='flex flex-wrap items-center justify-center gap-2.5'>
            {SUPPORTED_MODELS.map((model) => (
              <span
                key={model}
                className='border-border/70 text-muted-foreground rounded-full border bg-background px-4 py-1.5 text-sm'
              >
                {model}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
