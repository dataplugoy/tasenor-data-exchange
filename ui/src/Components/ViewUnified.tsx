import { sprintf } from 'sprintf-js'
import { ucfirst, AssetTransfer, AssetTransferReason, AssetType, TransactionDescription, Currency, AdditionalTransferInfo, AssetRates, isStockChangeDelta, haveCatalog, haveStore, ProcessConfig } from '@tasenor/common'
import { Trans } from 'react-i18next'
import { AccountBalanceTwoTone, CurrencyExchangeTwoTone, HttpsTwoTone, ListAltTwoTone, MonetizationOnTwoTone, QuestionMarkTwoTone, RequestQuoteTwoTone, SavingsTwoTone } from '@mui/icons-material'
import { Chip, Divider, Box } from '@mui/material'
import React from 'react'
import { green, pink, red, yellow, blue, grey, cyan, orange, teal, brown } from '@mui/material/colors'
import { ResultUnifiedItem } from '../Helpers/sorter'

interface ViewUnifiedProps {
  item: ResultUnifiedItem
}

// TODO: Pick the ideas below.
export const ViewUnified = (props: ViewUnifiedProps): React.JSX.Element => {
  const { item } = props
  return <pre>{JSON.stringify(item.data, null, 2)}</pre>
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
  const colors = {
    correction: brown[500],
    deposit: green[800],
    dividend: teal[500],
    expense: red[500],
    fee: pink[500],
    forex: orange[800],
    income: green[700],
    investment: green[600],
    tax: orange[900],
    trade: cyan[600],
    transfer: grey[200],
    unknown: grey[900],
    withdrawal: blue[600]
  }

  const text = {
    correction: grey[50],
    deposit: grey[50],
    dividend: grey[50],
    expense: grey[50],
    fee: yellow[400],
    forex: grey[300],
    income: grey[50],
    investment: grey[50],
    tax: yellow[300],
    trade: grey[900],
    transfer: grey[600],
    unknown: grey[700],
    withdrawal: red[50]
  }

  const Icon = {
    account: AccountBalanceTwoTone,
    crypto: HttpsTwoTone,
    currency: MonetizationOnTwoTone,
    external: SavingsTwoTone,
    forex: CurrencyExchangeTwoTone,
    statement: ListAltTwoTone,
    stock: RequestQuoteTwoTone
  }[type] || QuestionMarkTwoTone

  const title = `${ucfirst(type)} ${ucfirst(reason)}`

  return <Chip
    title={title}
    icon={<Icon style={{ color: text[reason] || text.unknown }}/>}
    label={<strong>{ucfirst(reason)}</strong>}
    size="medium"
    style={{
      color: text[reason] || text.unknown,
      backgroundColor: colors[reason] || colors.unknown
    }}
  />
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
