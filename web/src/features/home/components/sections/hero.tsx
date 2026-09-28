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

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

const TICKER_MODELS = [
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
    <section className='relative z-10'>
      {/* Metadata bar — figure number + establishment stamp */}
      <div className='tf-rule-b mx-auto flex max-w-6xl items-center justify-between px-6 pt-24 pb-3 md:pt-28'>
        <span className='tf-mono text-[11px]'>
          FIG.01 — AI MODEL MARKETPLACE
        </span>
        <span className='tf-mono text-[11px]'>
          TOKENFLOW <span className='tf-hl'>EST.2026</span>
        </span>
      </div>

      <div className='mx-auto max-w-6xl px-6 pt-10 pb-16 md:pt-14 md:pb-20'>
        {/* Display headline */}
        <h1 className='tf-display landing-animate-fade-up text-[clamp(3rem,9vw,7.5rem)] opacity-0'>
          {t('Every model.')}
          <br />
          <span className='tf-outline'>{t('One key.')}</span>
        </h1>

        <div className='mt-12 grid grid-cols-1 gap-10 md:mt-16 md:grid-cols-12'>
          {/* Mono manifesto */}
          <div
            className='tf-mono landing-animate-fade-up space-y-2 text-[11px] opacity-0 md:col-span-5 md:col-start-2'
            style={{ animationDelay: '80ms' }}
          >
            <p>TF/2026</p>
            <p>PAY PER TOKEN — NO SUBSCRIPTION</p>
            <p>
              <span className='tf-hl'>PUBLIC API</span> BY DEFAULT
            </p>
          </div>

          {/* Description + actions */}
          <div
            className='landing-animate-fade-up opacity-0 md:col-span-5 md:col-start-7'
            style={{ animationDelay: '140ms' }}
          >
            <p className='text-[15px] leading-relaxed'>
              {t(
                'Plug in one API key and call every model — GPT, Claude, Gemini, DeepSeek — from a single endpoint. Pay only for the tokens you burn. No plans, no lock-in, no surprises.'
              )}
            </p>

            <div
              className='landing-animate-fade-up mt-8 flex flex-wrap items-center gap-3 opacity-0'
              style={{ animationDelay: '200ms' }}
            >
              {props.isAuthenticated ? (
                <Button
                  className='tf-mono group h-12 rounded-none border border-[var(--tf-ink)] bg-[var(--tf-ink)] px-6 text-[12px] text-[var(--tf-paper)] hover:bg-[var(--tf-ink)]/85'
                  render={<Link to='/dashboard' />}
                >
                  {t('Go to Dashboard')}
                  <ArrowRight className='ml-1.5 size-4' />
                </Button>
              ) : (
                <Button
                  className='tf-mono group h-12 rounded-none border border-[var(--tf-ink)] bg-[var(--tf-acid)] px-6 text-[12px] text-[oklch(0.175_0_0)] hover:bg-[var(--tf-acid)]'
                  render={<Link to='/sign-up' />}
                >
                  {t('Get Started')}
                  <ArrowRight className='ml-1.5 size-4' />
                </Button>
              )}
              <Button
                variant='outline'
                className='tf-mono h-12 rounded-none border-[var(--tf-ink)] bg-transparent px-6 text-[12px] text-[var(--tf-ink)] hover:bg-[var(--tf-ink)] hover:text-[var(--tf-paper)] dark:bg-transparent'
                render={<Link to='/pricing' />}
              >
                {t('View Pricing')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Model ticker */}
      <div className='tf-marquee tf-rule-t tf-rule-b py-3' aria-hidden>
        <div className='tf-marquee-track'>
          {[0, 1].map((copy) => (
            <div key={copy} className='flex items-center'>
              {TICKER_MODELS.map((model, i) => (
                <span
                  key={model}
                  className='tf-mono flex items-center text-[12px]'
                >
                  <span className='px-6'>
                    {i === 2 ? <span className='tf-hl'>{model}</span> : model}
                  </span>
                  <span className='text-[10px] opacity-60'>✳</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
