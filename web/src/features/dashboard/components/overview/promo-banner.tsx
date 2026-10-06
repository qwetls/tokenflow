/*
Copyright (C) 2026 TokenFlow contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
The GNU Affero General Public License is available at
https://www.gnu.org/licenses/agpl-3.0.html

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.
*/
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, ExternalLink, Gift, RefreshCw, Send } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconBadge } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatQuotaWithCurrency } from '@/lib/currency'
import { handleServerError } from '@/lib/handle-server-error'
import { createServerError } from '@/lib/server-error-message'
import { cn } from '@/lib/utils'

import {
  claimWeekendBuild,
  getWeekendBuildStatus,
  getWeekendBuildTelegramStatus,
} from '../../api'

const REASON_MESSAGES: Record<string, string> = {
  already_claimed: 'Already claimed',
  no_api_usage: 'Use the API at least once to unlock this promo',
  no_telegram: 'Link your Telegram account to unlock this promo',
  not_joined_channel: 'Join our Telegram channel to unlock this promo',
  inactive: 'Log in regularly to unlock this promo',
  promo_ended: 'This promotion has ended',
}

function StepRow(props: {
  done: boolean
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          props.done
            ? 'bg-green-500/20 text-green-600'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {props.done ? <CheckCircle2 className="size-4" /> : '•'}
      </span>
      <span className="flex-1 text-sm">{props.title}</span>
      {props.children}
    </div>
  )
}

export function WeekendBuildBanner() {
  const { t } = useTranslation()
  const [claiming, setClaiming] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['weekend-build-status'],
    queryFn: async () => {
      const res = await getWeekendBuildStatus()
      if (res.success && res.data) {
        return res.data
      }
      throw createServerError(res, t('Failed to fetch promo status'))
    },
    staleTime: 60000,
  })

  const {
    data: tg,
    isLoading: tgLoading,
    refetch: refetchTg,
  } = useQuery({
    queryKey: ['weekend-build-telegram'],
    queryFn: async () => {
      const res = await getWeekendBuildTelegramStatus()
      if (res.success && res.data) {
        return res.data
      }
      throw createServerError(res, t('Failed to fetch Telegram status'))
    },
    staleTime: 30000,
  })

  const handleClaim = async () => {
    setClaiming(true)
    try {
      const res = await claimWeekendBuild()
      if (res.success) {
        toast.success(t('Promo claimed! Quota has been added to your account.'))
        refetch()
      } else {
        toast.error(res.message || t('Failed to claim promo'))
      }
    } catch (e) {
      handleServerError(e, t('Failed to claim promo'))
    } finally {
      setClaiming(false)
    }
  }

  const handleLinkTelegram = () => {
    // Redirect to the Security settings page where Telegram binding
    // is handled with the proper verification flow.
    window.open('/security', '_blank', 'noopener')
    toast.info(t('Link your Telegram account in Security, then return here and press Verify.'))
  }

  const handleVerify = async () => {
    setVerifying(true)
    try {
      await refetchTg()
      await refetch()
    } finally {
      setVerifying(false)
    }
  }

  if (isLoading || tgLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />
  }

  if (!data || !tg) {
    return null
  }

  // Hide the banner once the promotion has ended.
  if (data.reasons.includes('promo_ended')) {
    return null
  }

  const showClaimButton = data.eligible && !data.claimed
  const needsTelegram = !tg.linked
  const needsJoin = tg.linked && !tg.joined

  return (
    <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent p-5">
      <div className="flex items-start gap-4">
        <IconBadge tone="warning" className="shrink-0">
          {data.claimed ? (
            <CheckCircle2 className="size-5" />
          ) : (
            <Gift className="size-5" />
          )}
        </IconBadge>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold">
            {t('WEEKEND BUILD — 30M Free Claude Sonnet Tokens')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.claimed
              ? t(
                  'You have claimed this promo. Enjoy your tokens! Unspent promo quota expires on Monday, Oct 5 at 00:00 WIB.'
                )
              : t(
                  'Exclusive reward for our active users: {{quota}} quota, roughly 30M Claude Sonnet tokens. One claim per user. Unspent quota expires on Monday, Oct 5 at 00:00 WIB.',
                  { quota: formatQuotaWithCurrency(data.quota_grant) }
                )}
          </p>

          {!data.claimed && (
            <div className="mt-3 space-y-1 border-t border-border/50 pt-3">
              <StepRow
                done={tg.linked}
                title={t('Link your Telegram account')}
              >
                {needsTelegram && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleLinkTelegram}
                    >
                      <Send className="mr-1.5 size-3.5" />
                      {t('Link Telegram')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleVerify}
                      disabled={verifying}
                    >
                      <RefreshCw
                        className={cn(
                          'mr-1.5 size-3.5',
                          verifying && 'animate-spin'
                        )}
                      />
                      {t('Verify')}
                    </Button>
                  </div>
                )}
              </StepRow>
              <StepRow
                done={tg.joined}
                title={t('Join our Telegram channel {{channel}}', {
                  channel: tg.channel,
                })}
              >
                {needsJoin && (
                  <div className="flex gap-2">
                    <a
                      href={`https://t.me/${tg.channel.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium',
                        'hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <ExternalLink className="size-3.5" />
                      {t('Join Channel')}
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleVerify}
                      disabled={verifying}
                    >
                      <RefreshCw
                        className={cn(
                          'mr-1.5 size-3.5',
                          verifying && 'animate-spin'
                        )}
                      />
                      {t('Verify')}
                    </Button>
                  </div>
                )}
              </StepRow>
              <StepRow
                done={data.claimed}
                title={t('Claim your tokens')}
              >
                {showClaimButton && (
                  <Button onClick={handleClaim} disabled={claiming} size="sm">
                    {claiming ? t('Claiming...') : t('Claim Now')}
                  </Button>
                )}
              </StepRow>
            </div>
          )}

          {!data.claimed && !data.eligible && data.reasons.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
              {data.reasons.map((r) => (
                <li key={r}>{t(REASON_MESSAGES[r] ?? r)}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  )
}
