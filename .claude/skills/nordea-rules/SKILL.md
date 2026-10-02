---
name: nordea-rules
description: Convert Tasenor Bookkeeper "Nordea TITO" importer rules into TaDeX mapping rules so that every line of a given Nordea TITO statement (.nda) is handled. Use when given a .nda file like ~/Downloads/Nordea-tito-07.nda and asked to match it against the Nordea importer rules or to create TaDeX rules for it.
argument-hint: <path-to-statement.nda>
---

# Nordea TITO rules from the Bookkeeper importer

Goal: every line of the statement `$ARGUMENTS` has a TaDeX rule in the local flow plan `Nordea`, converted from the
rule the old Bookkeeper importer used for the same line.

- Bookkeeper importer config: `/home/wigy/projects/tasenor-backup/bookkeeper/staging/dataplug/export/importers/Nordea TITO/config.json`
  (`rules` are tried in order, first match wins; account numbers are in keys `account.<reason>.<type>.<asset>`).
- TaDeX rules: table `rules` of the flow plan titled `Nordea` in the local database (`tadex-db`, port 7300).
  Work only against the local TaDeX (API `http://localhost:7302/api/v1`), never production.

## 1. Match the lines

Run from the repository root:

```bash
backend/node_modules/.bin/tsx .claude/skills/nordea-rules/match.ts "$ARGUMENTS"
```

It parses the file with `backend/src/lib/tito.ts` (the same parser as the driver) and prints for each line the
first matching Bookkeeper rule and TaDeX rule. Add `--json` to see all fields of the lines (`Viesti`, `Lisätieto`,
`Toimeksiantajan tieto-1`, ...). If it fails, check that `tadex-db` is running.

Only lines with `TaDeX rule` `-- NONE --` need work. Look up each needed Bookkeeper rule from the config by name:

```bash
python3 -c "import json,sys; c=json.load(open(sys.argv[1])); print(json.dumps([r for r in c['rules'] if r['name']==sys.argv[2]], indent=1, ensure_ascii=False))" "/home/wigy/projects/tasenor-backup/bookkeeper/staging/dataplug/export/importers/Nordea TITO/config.json" "<rule name>"
```

### Check how the lines were booked before

The import runs next to the config (`<date>.json`) keep the answers given to the importer and the final postings.
Check each counterparty before converting:

```bash
python3 .claude/skills/nordea-rules/history.py '<counterparty regex>'          # or --field any to search messages too
```

The postings are the truth: they show extra lines added by the Bookkeeper analysis that the rule itself does not
show (e.g. VAT split to `47902` means the TaDeX rule needs `vat`), and how question-based rules and lines without
a rule were answered. Follow the most recent consistent practice and ask the user only if history is missing or
inconsistent.

## 2. Convert each rule to a TaDeX mapping rule

Write the converted rules as a JSON list of `SaveRuleRequest` objects (`schema/flow-plans/SaveRuleRequest.json`)
into the scratchpad. Prefer `kind: "MAPPING"`; use `ADVANCED` only when a filter cannot be expressed as conditions.
Keep the Bookkeeper rule name as the rule name (names must be unique within the flow plan).

```json
{"name": "Viite 1041 - SVOP TA", "kind": "MAPPING",
 "filterView": {"conditions": [{"field": "Viite", "operator": "equals", "value": "1041"}]},
 "resultView": {"action": "income", "account": "ACCOUNT_4030", "text": "SVOP (Tommi Aittola)", "tags": ["TA", "Nordea"]}}
```

### Filters

Field names are the same in both systems. TaDeX comparisons ignore case.

| Bookkeeper | TaDeX condition |
|---|---|
| `Viite == 'X'`, `$('Field') == 'X'`, `$('Field', '') == 'X'` | `{"field": "Field", "operator": "equals", "value": "X"}` |
| `has(['A', 'B'], $('Field'))` | `{"field": "Field", "operator": "oneOf", "value": ["A", "B"]}` |
| `regex('X', $('Field'))` | `{"field": "Field", "operator": "regex", "value": "X"}` |
| `$('Tapahtuman rahamäärä') < 0` / `> 0` | `{"field": "Tapahtuman rahamäärä", "operator": "negative"}` / `"positive"` (`field` is required also here) |
| `A or B` on the same field | `oneOf` or a regex `A\|B` |
| `A or B` on different fields | two rules (suffix the name, e.g. `... (Viite)`), or one `ADVANCED` rule |
| `Tietuetunnus != '10'` | not needed, TaDeX makes items only of transactions |

### Actions

The Bookkeeper result is a list of two legs: `currency` (the bank account itself, ignore it) and the other leg,
which decides the action. Resolve the account number with
`config["account.<reason>.<type>.<asset>"]` where reason, type and asset are the evaluated values of the other
leg (e.g. `account.expense.statement.BANKING_FEE` = `9690`), and book directly to it with `ACCOUNT_<number>`.

| Other leg | TaDeX `resultView` |
|---|---|
| `statement`, reason `expense` | `{"action": "expense", "account": "ACCOUNT_<number>"}` |
| `statement`, reason `income` | `{"action": "income", "account": "ACCOUNT_<number>"}` |
| `statement`, reason `investment` (e.g. `NREQ`, `UNPAID_PROFIT_DISTRIBUTIONS`) | `income` if money comes in, `expense` if it goes out, `ACCOUNT_<number>` |
| `statement`, reason `tax` | `{"action": "tax", "account": "TAX_<asset>"}` (tax needs a symbolic `TAX_` account, mapped once in the flow plan) |
| `external`, reason `transfer` | `{"action": "transfer", "service": "<asset>"}`, e.g. `Mintos`, `Nordnet` |

Expense, income and tax follow the sign of the amount, so a refund is booked to the same account by the same rule.

- `text`: convert the text expression into a template. `'Palvelumaksu'` → `Palvelumaksu`,
  `'Konsultointi' + par(capitalize($('Saaja/Maksaja')))` → `Konsultointi ({Saaja/Maksaja})`. Without a text,
  TaDeX uses `{Saaja/Maksaja} {Viesti}`.
- `tags`: take the literal tag names and strip extra quotes: `["'KIS'", "'Mintos'", "'Nordea'"]` → `["KIS", "Mintos", "Nordea"]`,
  `'[TR][Nordea]'` → `["TR", "Nordea"]`.
- VAT: if the history shows a VAT posting (e.g. `7695 14.61`, `47902 3.72` of 18.33), add
  `"vat": {"mode": "rate", "rate": 25.5}` with the rate the split gives. Otherwise no VAT.

### What cannot be converted directly

- **Rules depending on questions.** Results using question variables (`gadget`, `buyer`, `trip`, `explanation`,
  `accommodation`, `asset`, `taxType`, `taxTags`, `chosen(...)`) were answered per line in Bookkeeper. Find the
  question in `config.questions` and look at the earlier answers with `history.py`. If they are consistent, use
  them. Otherwise ask the user with AskUserQuestion, offering its `ask` options. Then either
  make a narrower rule for this kind of line (e.g. a specific counterparty) or tell the user to use **Handle once**
  in the TaDeX UI for that line. Tax types map to `TAX_<type>`, e.g. `Yhteisövero` → `TAX_CORPORATE_TAX`.
- **Account asked in Bookkeeper.** If the account value is an object with `ask` (e.g. `account.transfer.external.Nordnet`),
  ask the user which one applies.
- **Lines without a Bookkeeper rule.** Look them up with `history.py`: repeated manual answers (the `transfers`
  answer) can become a rule. If there is no history, show the line with its fields (`--json`) and ask the user.

## 3. Verify before saving

Test the converted rules without saving them:

```bash
backend/node_modules/.bin/tsx .claude/skills/nordea-rules/match.ts "$ARGUMENTS" --candidates <scratchpad>/rules.json --json
```

Candidates are tried after the existing rules, as a new rule in TaDeX would be. Check that every line now has a
`tadexRule` and that `tadexResult` has the expected type, value, account, text and tags. `match.ts` validates candidates with the same
schema as the API and reports compilation errors of mapping rules (bad account codes etc.) as exceptions.

Show the user a short table: line, amount, counterparty, Bookkeeper rule → TaDeX rule and account. List open
questions and the lines left for **Handle once**.

## 4. Save to the local TaDeX

After the user agrees, save the rules through the API of the running local backend. Log in with the account
given in `/home/wigy/projects/tasenor-devops/data-exchange.tasenor.com/README.md`:

```bash
A=http://localhost:7302/api/v1
TOK=$(curl -s -X POST $A/auth -H 'content-type: application/json' -d '{"email":"<email>","password":"<password>"}' | jq -r .token)
FLOW=$(docker exec tadex-db psql postgres://dev:02u3QD2e3wxssfdr3sxds@localhost:7300/tadex -Atc "select id from flow_plans where title = 'Nordea'")
jq -c '.[]' <scratchpad>/rules.json | while read -r rule; do
  curl -s -X POST $A/flow-plans/$FLOW/rules -H "Authorization: Bearer $TOK" -H 'content-type: application/json' -d "$rule" | jq -c '{id, name}'
done
```

A `400` with a message means an invalid rule or a duplicate name. Finally run step 1 again: every line must show a
TaDeX rule, except the ones agreed to be handled once.
