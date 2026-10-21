# Opening balances and stock from drivers

Status: steps 1–4 implemented for Nordea TITO, Tasenor, Nordnet and Lynx. Coinbase, Enable Banking and
Procountor are not done.

Differences from the plan:
- The question is its own type `OPENING_STATE`. Its dialog shows the proposal in the same editable tables as the
  plan details, since the question dialog is modal and the details could not be opened while it is shown. The
  confirmed values are stored as `setup.openingState`.
- Confirming does not write the plan's `balance` and `stock`; only the first batch starts from the confirmed
  values, and the plan gets its values when the batch completes, as before. Rolling back the last batch and
  abandoning a first batch both forget the confirmed state, so the next first batch gets a new proposal.
- Input drivers get a rate function and give their values already in the currency of the project. Cash in other
  currencies, and the cost of assets bought in them, are converted at the rate of the opening date.
- Lynx: the cost of assets in another currency is the cost worked back from the statement converted at the
  opening date rate, not the market value. A note says it is not the cost at the purchase rates.
- The date is the first day of the input data, or the plan's first date if that is later. The bookkeeping is
  asked for the same date.
- Tasenor is tested only against recorded responses, not a live bookkeeper.

## Problem

A new flow plan starts from empty `balance` and `stock`. The first batch copies them from the plan
(`BatchModel.getNext`, `models/BatchModel.ts:176-180`), and the analyzer then works from a wrong starting point:

| Starting value missing | What goes wrong |
|---|---|
| Cash on a `CURRENCY_*` account | The first outflow looks like it overdraws the account. It is booked to `DEBT_CURRENCY_*`, or the user is asked about debt accounts (`Analyzer.ts:225-285`). Later inflows "pay back" this debt that never existed. |
| Holdings of a security | A sell is treated as a short sell and booked without profit or loss (`sell.ts:29-79`). Trade and transfer-out fail with "Cannot give/send ... when having only 0". The next buy is booked as closing the short. |
| Cost of a holding | Profit and loss of sells are wrong (`sell.ts:83`). |

Today the only fixes are the CLI (`init-stock`, `init-balance`) or typing the values into the plan details before
the first run. Both are easy to forget, and the right numbers are hard to find by hand.

## Goal

Before the first batch is analyzed, TaDeX proposes the opening balances and holdings as of the plan's
`firstDate`. They come from the drivers that know them: the input source, the bookkeeping, or both. The user reviews
the proposal and accepts it once, then the batch continues.

## What the drivers can provide

| Driver | Cash | Holdings | Source |
|---|---|---|---|
| Nordea TITO | Exact, per account | – | T00 opening balance (`lib/tito.ts:71-95`), already parsed but only used for a consistency check |
| Nordnet | Derived | Derived, only for securities that appear in the file | Every row has `Saldo` (cash after the row), `Kokonaismäärä` (quantity after the row) and `Hankinta-arvo` (cost); the state before a row is the row's value minus its own change |
| Lynx | Exact, per currency | Quantities exact; cost not given at the start | Full Activity Statement sections, all currently skipped (`lib/lynx.ts:17-18`); see below |
| Coinbase (v1 only) | Derived, per asset | Same | Running `balance` column, currently ignored |
| Enable Banking | Current only | – | `GET /accounts/{uid}/balances`, not called; needs back-calculation to `firstDate` |
| S-Pankki | – | – | No balance column |
| Tasenor bookkeeper (output) | Yes, every mapped account | Yes, with cost | `GET /db/{db}/period/{id}` gives account totals; `?data` adds collected assets `{amount, value}`. Keyed by remote account number. |
| Procountor (output) | Possible from the ledger | – | Not explored; no stock is kept there |

## Design

### 1. Driver feature

A new type in `schema/OpeningState.json`:

```ts
interface OpeningState {
  date: string                 // the date the values hold at (start of day)
  balance: BalanceData         // keyed by resolved account code
  stock: StockData             // [resolved account code][asset] -> { amount, value }
  source: string               // driver type, shown to the user
  notes: string[]              // caveats, e.g. "holdings known only for securities traded in this file"
}
```

`Driver` gets `canProvideOpeningState(): boolean`, false by default. The two hooks are:

- `InputDriver.openingState(batch: BatchModel, date: string): Promise<OpeningState | null>` reads the batch's raw
  data. Rows dated before `date` are already dropped when the input is itemized (`FlowPlanModel.ts:412`). The driver
  must count them in, so the value is the state at `date`, not at the start of the file.
- `OutputDriver.openingState(date: string): Promise<OpeningState | null>` reads the bookkeeping. It translates
  remote account numbers to codes by inverting `setup.accounts`. Accounts that aren't mapped are left out and listed
  in `notes`. If several codes point to the same account, the value goes to the code `resolveAccount` would give.
  If that is unclear, it is left out and noted.

All keys must already be in resolved form (`resolver.ts:21-30`, e.g. `STOCK_X` → `STOCK` with
`singleStockAccount`), or the analyzer won't find them.

### 2. Merging and confirming

The new step runs in `FlowPlanModel` when the batch is the plan's first one and the plan's `setup` doesn't yet
have `openingStateConfirmed`. It runs after the items are unified and before they are analyzed.

1. Ask both drivers that can provide a state. Merge them key by key, with the bookkeeping first. The bookkeeping is
   what new entries continue from, and its cost values follow its own method. The input source fills in what the
   bookkeeping doesn't map. When both have a value and they differ, keep the bookkeeping's and add a note.
2. Write the result into the plan's `balance` and `stock` (and the batch's `initialBalance`/`initialStock`), only
   where the plan has no value yet. Values typed in by hand win.
3. Ask one question through the existing `AnswersRequired` mechanism: "Opening balances were filled from
   <sources>. Check them under Show details, then confirm." Include the notes. The plan details tables can already
   edit both, so no new UI is needed beyond the question.
4. When answered, set `setup.openingStateConfirmed` and continue. Rolling back the first batch clears the flag.

If no driver can provide anything, the step changes nothing and doesn't ask, so the current behaviour stays.

### 3. Implementations, in order

1. **Nordea TITO input.** The T00 opening balance, plus the transactions dated before `date`, goes into
   `BANK_<IBAN>`. Small, exact, and the fixture already has it.
2. **Tasenor output.** `GET /db/{db}/period` → the period containing `date` → `GET /db/{db}/period/{id}?data`.
   Take balances and assets up to `date`. If `date` is not the first day of the period, the entries between need
   to be excluded: check whether the API can limit by date, or sum the entries ourselves.
3. **Nordnet input.** For each portfolio and currency: cash before the first kept row. For each security: quantity
   and cost before its first kept row. Holdings that weren't traded in the file can't be known, so add a note
   saying so.
4. **Lynx input.** A full Activity Statement (sample: `U7076631_20260703_20261020.csv`, period 2026-07-03 to
   2026-10-20, base currency EUR) has these sections:

   | Section | Gives | Time |
   |---|---|---|
   | Cash Report, rows `Starting Cash` per currency (not `Base Currency Summary`) | Cash, e.g. EUR -6329.17, USD 3303.81, GBP -0.00003 | Statement start |
   | Statement of Funds, `Opening Balance` per currency | The same cash, followed by every cash movement with a running balance | Statement start, then daily |
   | Mark-to-Market Performance Summary, `Prior Quantity` per symbol | Quantity held | Statement start |
   | Positions and Mark-to-Market Profit and Loss, `Prior Quantity` and `Prior Price` with currency | Quantity and market price | Statement start |
   | Open Positions, `Quantity` and `Cost Basis` in trade currency | Quantity and cost | Statement end |
   | Trades, `Basis` and `Realized P/L` | Cost of the lots closed by each sell | Per trade |

   - **Cash:** take `Starting Cash` per currency into `CURRENCY_<cur>`. If `date` is after the statement start, use
     the Statement of Funds running balance at `date` instead.
   - **Negative cash:** a negative opening cash is a margin loan. Book it to `DEBT_CURRENCY_<cur>` instead, or the
     first outflow triggers the debt handling on top of it. Check this against how the analyzer treats an
     existing negative `CURRENCY_*` balance.
   - **Quantities:** take them from `Prior Quantity`.
   - **Cost:** the statement has no cost at the start. It could be worked back as end `Cost Basis` minus period
     buys plus the `Basis` of period sells. That is in trade currency (mostly USD), while TaDeX stock values are in
     EUR at the original purchase rates, which the statement doesn't have. So leave the cost to the bookkeeping. If
     the bookkeeping has no value, use the market value at the start (`Prior Price` × quantity, converted at the
     start date rate) and add a note saying it is not the real cost.
   - The current parser drops these sections in `parseLynxRows`. They need their own small parser, since their
     columns differ per section.
5. Coinbase v1, Enable Banking and Procountor when needed.

### 4. Tests

- Unit tests per driver against the existing fixtures: TITO (opening +1000.00 EUR), Nordnet sell sample (MANTA
  quantities), and a Tasenor response fixture.
- A merge unit test: bookkeeping vs input precedence, values typed in by hand win, unmapped accounts are noted.
- An API test for the first-batch question and confirmation.

## Decisions

- The bookkeeping comes first, and the input source fills the gaps (decided 2026-10-21).
- The proposal is always confirmed by the user before the first batch continues (decided 2026-10-21).

- The Lynx fixture is made up, not taken from a real statement (decided 2026-10-21):
  `testing/unit/data/Lynx-opening.csv`, period 2024-01-01 to 2024-03-31, base EUR. Expected opening state:

  | | Opening | End |
  |---|---|---|
  | EUR cash | -2000 (margin loan) | -1937.34 |
  | USD cash | 1500 | 2498 |
  | AAA (USD) | 500, cost 5000 USD, prior price 12 | 300 |
  | BBB (USD) | 0 | 100 |
  | DDD1V (EUR) | 200, cost 1600 EUR, prior price 7.5 | 200 |

  The period has a BBB buy, an AAA sell (basis -2000), a DDD1V dividend with tax and EUR debit interest. The
  numbers add up across Cash Report, Statement of Funds, Open Positions and Trades, using USD/EUR 0.90 at the
  start and 0.92 at the end.
