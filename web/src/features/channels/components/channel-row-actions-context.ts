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
import { createContext } from 'react'

/**
 * Where channel row-derived controls are being rendered. Card view can tune
 * compact display details while table view keeps the full desktop treatment.
 */
export type ChannelRowActionsLayout = 'table' | 'card'

export const ChannelRowActionsLayoutContext =
  createContext<ChannelRowActionsLayout>('table')
