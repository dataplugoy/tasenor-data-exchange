import { useTranslation } from 'react-i18next'
import { CoffeeTwoTone, CurrencyExchangeTwoTone, ListAltTwoTone, MonetizationOnTwoTone, PaymentTwoTone, QuestionMark, SavingsTwoTone, SellTwoTone, ShoppingCartTwoTone } from '@mui/icons-material'
import { Chip, Box, Typography } from '@mui/material'
import React from 'react'
import { green, red, blue, grey, cyan, teal, brown } from '@mui/material/colors'
import { ResultUnifiedItem } from '../Helpers/sorter'
import { UnifiedItemData } from '../Types/API/UnifiedItemData'
import { UnifiedItemType } from '../Types/API/UnifiedItemType'
import clone from 'clone'
import { useApp } from '../Hooks/useApp'

interface UnifiedTypeChipProps {
  type: UnifiedItemType
  reason?: string
}

export const UnifiedTypeChip = (props: UnifiedTypeChipProps): React.JSX.Element => {
  const { type, reason } = props
  const { t } = useTranslation()

  const colors = {
    buy: brown[500],
    deposit: green[800],
    dividend: teal[500],
    expense: red[500],
    income: green[700],
    trade: cyan[600],
    sell: grey[200],
    unknown: grey[900],
    withdrawal: blue[600]
  }

  const textColors = {
    buy: grey[50],
    deposit: grey[50],
    dividend: grey[50],
    expense: grey[50],
    income: grey[50],
    trade: grey[900],
    sell: grey[600],
    unknown: grey[700],
    withdrawal: red[50]
  }

  const Icons = {
    buy: ShoppingCartTwoTone,
    deposit: SavingsTwoTone,
    expense: CoffeeTwoTone,
    income: MonetizationOnTwoTone,
    trade: CurrencyExchangeTwoTone,
    sell: SellTwoTone,
    unknown: QuestionMark,
    withdrawal: PaymentTwoTone,
  }

  const title = reason ? (t(`${type.toUpperCase()}_${reason}`)) : t(`${type.toUpperCase()}`)
  const Icon = Icons[type] || Icons.unknown

  return <Chip
    title={title}
    icon={<Icon style={{ color: textColors[type] || textColors.unknown }}/>}
    label={title}
    size="medium"
    style={{
      color: textColors[type] || textColors.unknown,
      backgroundColor: colors[type] || colors.unknown
    }}
  />
}

interface ViewUnifiedProps {
  item: ResultUnifiedItem
}

// TODO: Pick the ideas below.
export const ViewUnified = (props: ViewUnifiedProps): React.JSX.Element => {
  const data: UnifiedItemData = clone(props.item.data)
  const notRendered = new Set(Object.keys(data))
  const app = useApp()
  const { currency } = app.project.settings
  const { t } = useTranslation()

  /**
   * Helper to get and remove values from item data.
   */
  const pick = (name, def: any = undefined) => {
    if (!(name in data)) {
      return def
    }
    notRendered.delete(name)
    return data[name]
  }

  // Render type.
  const rendered = [<UnifiedTypeChip key="type" type={pick('type')} reason={pick('reason')}/>]

  // Render value.
  const value = pick('value')
  const valueAsset = pick('valueAsset', currency)
  rendered.push(<Typography sx={{ ml: 1 }} key="asset" component="span" className="unified value" title={t('Total value of the transaction')}> {value} {valueAsset}</Typography>)

  // Render account.
  const account = pick('account')
  if (account) {
    rendered.push(<Typography sx={{ ml: 1 }} key="account" component="span" className="unified account" title={t('Symbolic name of the account associated with the transaction')}><ListAltTwoTone sx={{ mb: -0.7 }}/> {account}</Typography>)
  }

  // Render rates.
  const rates = pick('rates')
  if (rates) {
    if (parseFloat(`${rates[currency]}`) === 1) {
      delete rates[currency]
    }
    if (Object.keys(rates).length) {
      const strings = Object.keys(rates).map(c => `1 ${currency} = ${rates[c]} ${c}`)
      rendered.push(<Typography sx={{ ml: 1 }} key="rates" component="span" className="unified rates" title={t('Conversion rates to the default currency')}><CurrencyExchangeTwoTone sx={{ mb: -0.7 }}/> {strings.join(', ')}</Typography>)
    }
  }

  return <Box sx={{ py: 1 }}>
    {rendered}
    {notRendered.size > 0 && <Box>TODO: {JSON.stringify([...notRendered])}</Box>}
  </Box>
}
