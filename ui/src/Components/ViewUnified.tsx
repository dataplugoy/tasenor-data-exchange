import { useTranslation } from 'react-i18next'
import { ArticleTwoTone, AttachMoneyTwoTone, CoffeeTwoTone, CurrencyBitcoin, CurrencyExchangeTwoTone, ListAltTwoTone, MonetizationOnTwoTone, PaymentTwoTone, QuestionMark, SavingsTwoTone, SellTwoTone, ShoppingCartTwoTone } from '@mui/icons-material'
import { Chip, Box, Typography, SxProps, Theme } from '@mui/material'
import React from 'react'
import { green, red, blue, grey, cyan, teal, brown } from '@mui/material/colors'
import { ResultUnifiedItem } from '../Helpers/sorter'
import { UnifiedItemData } from '../Types/API/UnifiedItemData'
import { UnifiedItemType } from '../Types/API/UnifiedItemType'
import clone from 'clone'
import { useApp } from '../Hooks/useApp'
import { added2str, date2str } from '../Helpers/stringify'
import { Language, Timestring, isCurrency } from '@tasenor/common'

interface UnifiedTypeChipProps {
  type: UnifiedItemType
  asset?: string
  reason?: string
  service?: string
}

export const UnifiedTypeChip = (props: UnifiedTypeChipProps): React.JSX.Element => {
  const { type, reason, asset, service } = props
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

  let title = reason ? (t(`${type.toUpperCase()}_${reason}`, { reason, asset })) : t(`${type.toUpperCase()}`)
  const Icon = Icons[type] || Icons.unknown

  if (service) {
    switch (type) {
      case 'deposit':
        title = t('Deposit to {{service}}', { service })
        break
      case 'withdraw':
        title = t('Withdrawal from {{service}}', { service })
        break
      default:
        throw new Error(`No handler for service related title of type '${type}'.`)
    }
  }

  return <Chip
    sx={{ ml: 1 }}
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

interface AssetTypeIconProps {
  type: 'STOCK' | 'CURRENCY' | 'CRYPTO' | 'UNKNOWN'
  sx?: SxProps<Theme>
}

export const AssetTypeIcon = (props: AssetTypeIconProps): React.JSX.Element => {
  const { type, sx } = props
  switch (type) {
    case 'STOCK':
      return <ArticleTwoTone sx={sx}/>
    case 'CRYPTO':
      return <CurrencyBitcoin sx={sx}/>
    case 'CURRENCY':
      return <AttachMoneyTwoTone sx={sx}/>
    default:
      return <QuestionMark sx={sx}/>
  }
}

interface ViewUnifiedProps {
  item: ResultUnifiedItem
}

export const ViewUnified = (props: ViewUnifiedProps): React.JSX.Element => {
  const data: UnifiedItemData = clone(props.item.data)
  const notRendered = new Set(Object.keys(data))
  const app = useApp()
  const { currency, language } = app.project.settings
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

  // Ignore few.
  pick('multipart')

  // Render type.
  const rendered = [
    <Typography key="time" className="unified time" title={props.item.time}>{date2str(props.item.time as Timestring, language as Language)}</Typography>,
    <UnifiedTypeChip key="type" type={pick('type')} reason={pick('reason')} asset={pick('reasonAsset')} service={pick('service')}/>
  ]

  // Render value.
  const value = pick('value')
  const valueAsset = pick('valueAsset', currency)
  rendered.push(<Typography sx={{ ml: 1 }} key="asset" component="span" className="unified value" title={t('Total value of the transaction')}> {value} {valueAsset}</Typography>)

  // Render fee.
  const fee = pick('fee')
  const feeAsset = pick('feeAsset', currency)
  if (fee !== undefined) {
    if (parseFloat(`${fee}`) !== 0) {
      rendered.push(<Typography sx={{ ml: 1 }} key="vee" component="span" className="unified fee" title={t('Fee charged for the transaction')}> {fee} {feeAsset}</Typography>)
    }
  }

  // Render assets.
  const assetIn = pick('assetIn')
  if (assetIn) {
    const assetTypeIn = pick('assetTypeIn', isCurrency(assetIn) ? 'CURRENCY' : 'UNKNOWN')
    const assetAmountIn = pick('assetAmountIn')
    // TODO: Asset type symbol.
    rendered.push(<Typography sx={{ ml: 1 }} key="assetIn" component="span" className="unified asset-in" title={t('Amount of an asset added to the stock')}><AssetTypeIcon type={assetTypeIn} sx={{ mb: -0.7 }}/>{added2str(assetAmountIn, assetIn, language as Language)}</Typography>)
  }

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

  // Append text if given.
  const text = pick('text')
  if (text) {
    rendered.push(<Typography key="text" sx={{ ml: 1, mt: 0.6 }} className="unified text" title={t('Explicit explanation provided for the transaction')}>{text}</Typography>)
  }

  return <Box sx={{ py: 1 }}>
    {rendered}
    {notRendered.size > 0 && <Box>TODO: {JSON.stringify([...notRendered])}</Box>}
  </Box>
}
