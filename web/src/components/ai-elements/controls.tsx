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
'use client'

import { Controls as ControlsPrimitive } from '@xyflow/react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export type ControlsProps = ComponentProps<typeof ControlsPrimitive>

export const Controls = ({ className, ...props }: ControlsProps) => (
  <ControlsPrimitive
    className={cn(
      'bg-card gap-px overflow-hidden rounded-md border p-1 shadow-none!',
      '[&>button]:hover:bg-secondary! [&>button]:rounded-md [&>button]:border-none! [&>button]:bg-transparent!',
      className
    )}
    {...props}
  />
)
