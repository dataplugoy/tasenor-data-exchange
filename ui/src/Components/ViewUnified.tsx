import { sprintf } from 'sprintf-js'
import { AssetTransfer, AssetTransferReason, AssetType, TransactionDescription, Currency, AdditionalTransferInfo, AssetRates, isStockChangeDelta, haveCatalog, haveStore, ProcessConfig } from '@tasenor/common'
import { Trans, useTranslation } from 'react-i18next'
import { CoffeeTwoTone, CurrencyExchangeTwoTone, ListAltTwoTone, MonetizationOnTwoTone, PaymentTwoTone, QuestionMark, QuestionMarkTwoTone, RequestQuoteTwoTone, SavingsTwoTone, SellTwoTone, ShoppingCartTwoTone } from '@mui/icons-material'
import { Chip, Divider, Box } from '@mui/material'
import React from 'react'
import { green, red, blue, grey, cyan, teal, brown } from '@mui/material/colors'
import { ResultUnifiedItem } from '../Helpers/sorter'
import { UnifiedItemData } from '../Types/API/UnifiedItemData'
import { UnifiedItemType } from '../Types/API/UnifiedItemType'
import clone from 'clone'
import { useApp } from '../Hooks/useApp'

interface UnifiedTypeChipProps {
  type: UnifiedItemType
}

export const UnifiedTypeChip = (props: UnifiedTypeChipProps): React.JSX.Element => {
  const { type } = props
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

  const title = t(`UnifiedItemType-${type}`)
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

  // Render type. TODO: Add reason here.
  const rendered = [<UnifiedTypeChip key="type" type={pick('type')}/>]

  // Render value.
  const value = pick('value')
  const valueAsset = pick('valueAsset', currency)
  rendered.push(<Box component="span" key="asset" sx={{ color: 'primary.main' }}> {value} {valueAsset}</Box>)

  // Render account.
  const account = pick('account')
  if (account) {
    rendered.push(<Box component="span" key="account"> {account}</Box>)
  }
  return <Box sx={{ py: 1 }}>
    {rendered}
    <> </>TODO: {JSON.stringify([...notRendered])}
  </Box>
}

/** *********************** OLD SHIT BELOW ********************************************************/

/**
 * Display a chip describing the type and reason of the transfer.
 * @param props
 * @returns
 */
export type ReasonChipProps = {
  reason: AssetTransferReason
  type: AssetType
}
export const ReasonChip = (props: ReasonChipProps): React.JSX.Element => {
  const { reason, type } = props

  const Icon = {
    statement: ListAltTwoTone,
    stock: RequestQuoteTwoTone
  }[type] || QuestionMarkTwoTone

  return <></>
}

/**
 * Display a text showing the value of the asset in the configured currency.
 */
export type AssetValueProps = {
  value: number
  currency: Currency
}
export const AssetValue = (props: AssetValueProps): React.JSX.Element => {
  const catalog = haveCatalog()
  return <span><Trans>Asset value</Trans> {catalog.money2str(props.value, props.currency)}</span>
}

/**
 * Display delta of stock changes in values and amounts.
 */
export type StockChangesProps = {
  data: AdditionalTransferInfo
  currency: Currency
}
export const StockChanges = (props: StockChangesProps): React.JSX.Element => {
  const catalog = haveCatalog()
  const { data, currency } = props
  if (isStockChangeDelta(data)) {
    return <span>
      <Trans>Stock Δ</Trans>
      {
        Object.keys(data.stock.change).map(asset => {
          const { value, amount } = data.stock.change[asset]
          return ` ${amount < 0 ? '' : '+'}${amount} ${asset} (${catalog.money2str(value, currency, true)})`
        }).join('')
      }
    </span>
  }
  return <></>
}

/**
 * Display rates used in calculations.
 */
export type RatesListProps = {
  rates: AssetRates
  currency: Currency
}
export const RatesList = (props: RatesListProps): React.JSX.Element => {
  const catalog = haveCatalog()
  const { rates, currency } = props
  const assets = Object.keys(rates)
  if (assets.length) {
    return <span>
      <Trans>Rates</Trans>
      {
        assets.map(asset => {
          return ` ${catalog.money2str(100 * rates[asset], currency)}/${asset}`
        }).join('')
      }
    </span>
  }
  return <></>
}

/**
 * Display per asset counter.
 */
export type PerAssetProps = {
  count: number
  value: number
  currency: Currency
}
export const PerAsset = (props: PerAssetProps): React.JSX.Element => {
  return <>{props.count} ⨉ {sprintf('%f', props.value)} {props.currency}</>
}

/**
 * Render a full explanation of one single transfer.
 */
export type TransferLineProps = {
  config: ProcessConfig,
  transfer: AssetTransfer
}
export const TransferLine = (props: TransferLineProps): React.JSX.Element => {
  const config = props.config
  const { reason, amount, type, value, data, asset } = props.transfer
  return <>
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      width: 'fit-content',
      mb: 1
    }}>
      <ReasonChip reason={reason} type={type}/>
      <span>{amount !== undefined && amount < 0 ? '' : '+'}{amount}<strong> {asset}</strong></span>
      {value !== undefined && <>
        <Divider orientation="vertical" variant="middle" flexItem />
        <AssetValue value={value} currency={config.currency as Currency} />
      </>}
      {data && data.stock && <>
        <Divider orientation="vertical" variant="middle" flexItem />
        <StockChanges data={data} currency={config.currency as Currency} />
      </>}
      {data && data.count && data.perAsset !== undefined && <>
        <Divider orientation="vertical" variant="middle" flexItem />
        <PerAsset count={data.count} value={data.perAsset} currency={data.currency || config.currency as Currency} />
      </>}
      {data && data.rates && <>
        <Divider orientation="vertical" variant="middle" flexItem />
        <RatesList rates={data.rates} currency={config.currency as Currency} />
      </>}
    </Box>
  </>
}

/**
 * Display a set of transfers.
 */
export type TransferViewProps = {
  config: ProcessConfig,
  result: TransactionDescription
}
export const TransferView = (props: TransferViewProps): React.JSX.Element => {
  const store = haveStore()
  if (!store.database) {
    return <></>
  }
  const { transfers, transactions } = props.result
  return <>
    { transfers && transfers.map((transfer, idx) => <TransferLine key={idx} config={props.config} transfer={transfer} />)}
    { transactions && <Box sx={{ mt: 1 }}>
      </Box>
    }
  </>
}

/**
 * Display result from classification and analysis.
 * @param props
 * @returns
 */
export type ImportResultViewProps = {
  config: ProcessConfig,
  result: TransactionDescription[]
}
export const ImportResultView = (props: ImportResultViewProps): React.JSX.Element => {

  if (props.result === null) {
    return <></>
  }

  return (
    <Box>
    { props.result.map((transfer, idx) => <TransferView key={idx} config={props.config} result={transfer} />) }
    </Box>
  )
}
