# Rules that ask questions

Status: steps 1–5 implemented. Step 6 (skill and Nordea rules) is open.

Differences from the plan:
- The batch view does not list the answers separately; they show in the unified item's tags, account and text.
- No UI end-to-end test yet. Unit tests cover the merge, defaults, validation and unify; an API test covers the
  question endpoints.

## Problem

A mapping rule decides the whole result of a line. Some lines are always booked the same way except for one or two
details that change from line to line:

| Line | Fixed by the rule | Changes per line |
|---|---|---|
| Onnibus, VR tickets | expense, account 7800, VAT 10% | which company member (tags), the route (text) |
| Verkkokauppa.com purchases | expense, VAT | type of purchase (account), what was bought (text) |
| Nordnet deposits and withdrawals | transfer to Nordnet | which fund (tag) |

The old Bookkeeper importer handled these with questions (`buyer`, `trip`, `asset`, `gadget`, `fund`) shared by
many rules: the same "Osakkaiden tägit" question was used by the VR, Onnibus, Verkkokauppa.com and other rules.
TaDeX has no such thing today. Its options are a rule per variation, which is impossible when the variation is
free, or **Handle once**, which makes the user fill in the whole result, account and VAT included, for every line.

## Goal

Questions are defined once per project, with their options, and attached to any number of mapping rules. When
such a rule matches a line, TaDeX asks the attached questions for that line, the same way it now asks about
unmatched lines, and takes everything else from the rule.

## Questions

A question belongs to a project, so it is shared by all flow plans and rules of the project. It has a kind that
decides what the answer changes in the result of the rule:

| Kind | Options | Answer | Effect on the result | Bookkeeper equivalent |
|---|---|---|---|---|
| `TAGS` | list of tag sets with labels, e.g. `Tommi` → `[TR]`, `Tommi, Khaya` → `[TR, KR]` | one option | tags added to the tags of the rule | `buyer` (Osakkaiden tägit), `fund` (chooseTag) |
| `ACCOUNT` | list of accounts with labels, e.g. `Ohjelmistot` → `EXPENSE_SOFTWARE` | one option | replaces the account of the rule | `asset` (Verkkokaupan ostoksen tyyppi) |
| `TEXT` | none | free text | inserted into the text template at `{?name}` | `trip`, `gadget`, `explanation` |

Example questions of the Dataplug project:

```json
[
  { "name": "members", "kind": "TAGS", "label": "Kenelle tapahtuma kuuluu", "options": [
    { "label": "Tommi Ronkainen", "tags": ["TR"] },
    { "label": "Khaya Ronkainen", "tags": ["KR"] },
    { "label": "Tommi, Khaya", "tags": ["TR", "KR"] }
  ] },
  { "name": "route", "kind": "TEXT", "label": "Matkareitti" },
  { "name": "purchase", "kind": "ACCOUNT", "label": "Ostoksen tyyppi", "options": [
    { "label": "Ohjelmistot", "account": "EXPENSE_SOFTWARE" },
    { "label": "Toimistotarvikkeet", "account": "ACCOUNT_8620" }
  ] }
]
```

Not in scope: asking the VAT amount (Bookkeeper `vat`). The rate on the rule covers the known cases. A line with
odd VAT is still handled once.

## Data model

### Questions (new table `rule_questions`)

```prisma
model RuleQuestion {
  id          Int             @id @default(autoincrement())
  created     DateTime        @default(now())
  updated     DateTime        @updatedAt

  projectId   Int
  project     Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)

  name        String          // identifier used in text templates, e.g. `route`
  kind        RuleQuestionKind
  label       String          // shown when asking
  options     Json            @default("[]")

  @@unique([projectId, name])
  @@map(name: "rule_questions")
}

enum RuleQuestionKind {
  TAGS
  ACCOUNT
  TEXT
}
```

Schema `schema/RuleQuestion.json`. `name` is a short identifier (`^[a-z][a-zA-Z0-9_]*$`). `TAGS` and `ACCOUNT`
need at least one option, `TEXT` has none. A question used by rules cannot be deleted (the API answers `400` and
names the rules). Changing options is allowed.

A table instead of a project setting: questions get their own API and page, and rules can refer to them by id,
so renaming a question or its label does not break rules.

### Rule (`schema/MappingResultView.json`)

New optional property `ask`, a list of question ids:

```json
{ "action": "expense", "account": "ACCOUNT_7800", "text": "Bussilippu: {?route}",
  "tags": ["Nordea"], "vat": { "mode": "rate", "rate": 10 }, "ask": [3, 4] }
```

- The questions must belong to the project of the flow plan, and at most one question of kind `ACCOUNT` can be
  attached.
- With an `ACCOUNT` question, the rule's own `account` is optional and serves as the default answer.
- A `TEXT` question is placed into the text with `{?name}`. If the template does not contain it, the answer is
  appended after a space.
- `compileResult` keeps compiling the fixed parts as now. The answers are not compiled into the expression; they are
  merged after evaluation (below). `{?name}` is kept as a literal placeholder in the compiled text.

### Answers (`schema/Setup.json`)

New map `setup.lineAnswers` in the flow plan, kept apart from `setup.answers` (which replaces the whole result of a
line):

```json
"lineAnswers": {
  "<answerKey of the line>": { "rule": 476, "answers": { "3": 0, "4": "TRE-HKI" } }
}
```

- Keyed with `driver.answerKey(input)`, like the one-off answers.
- `answers` is keyed by question id. `TAGS` and `ACCOUNT` answers are the index of the chosen option, but the
  chosen tags or account are copied as well (`{ "option": 0, "tags": ["TR"] }`), so that later edits of the
  options do not change lines already booked.
- `rule` records which rule the answers were given for, for showing them later.
- Old matches are never asked again. Answers stay with the line whatever happens to the rules or questions later:
  editing a question's options, attaching or detaching questions, or editing and reordering rules does not
  re-ask lines that already have answers. Only lines without an entry in `lineAnswers` are asked.
- `updateSetup` merges `lineAnswers` per key like `answers`, and `null` removes an entry.

## Processing

In `InputDriver.applyUnifyRules`, after `applyRules` returns the matched rule and its result:

1. If the rule has no `ask`, continue as now.
2. Look up `setup.lineAnswers[answerKey]`. If the line has an entry, merge its answers into the result: tags
   appended without duplicates, the account replaced, `{?name}` in the text replaced by the text answer (an
   unanswered placeholder is removed). The entry is used as it is, even if the rule's questions have changed.
3. Otherwise load the attached questions (cached per run) and throw a new `RuleQuestionsRequired` error carrying
   the line, the rule and its questions.

`FlowPlanModel.unifyItems` catches it like `NoMatchingRuleError`: the input item is left unprocessed and collected.
After the loop, if there are unmatched lines or lines with questions, it throws one `AnswersRequired` with both, so
the user sees everything at once. A new factory `AnswersRequired.forRuleQuestions` builds a question of a new type
`RULE_QUESTIONS` with `variable: "lineAnswers"` and
`args: { flowPlanId, questions: [RuleQuestion...], items: [{ key, line, time, text, total, fields, ruleId, ruleName, ask, defaults }] }`.

The existing settings tags (`setup.settings.tags`) are still added after this, as now.

### Defaults

To keep repeated lines quick, each question is pre-filled with the answer given last time to the same question for
the same rule, or failing that, the last answer to the same question for any rule of the flow plan. The user only
confirms.

## UI

- **Questions page** (new, under Settings or Rules): list of the project's questions with create, edit and
  delete. The editor has name, label, kind and, for `TAGS` and `ACCOUNT`, a list of options (label + tags, or
  label + category/account number using the same picker as the rule action). Shows which rules use a question.
- **Rule dialog** (`MappingRuleDialog`, `RuleActionEditor`): **Ask for each line**, a multi-select of the
  project's questions, with a link to create a new one. For attached `TEXT` questions, `{?name}` is offered for
  insertion next to the field names of the text template.
- **Rule preview** (`RulePreview`): matching lines show the fixed result and a note "Asked for each line: Kenelle
  tapahtuma kuuluu, Matkareitti". The preview applies the default answers when they exist.
- **Questions panel**: a new `QuestionRuleQuestionsPanel` for `RULE_QUESTIONS`. A table with one row per line
  (date, amount, counterparty, message, rule name), and on each row an input per missing question: a select for
  `TAGS` and `ACCOUNT`, a text field for `TEXT`, pre-filled with the defaults. Rows of the same rule are grouped,
  and "use for all" copies the first row's answers to the other rows of the group. It posts
  `{ lineAnswers: { <key>: { rule, answers } } }` to `PATCH /flow-plans/:id/configure`.
- **Rules list**: rules with `ask` show a chip **Asks**, and `describeAction` lists the questions, e.g.
  "Expense, Travel, VAT 10%, asks Kenelle tapahtuma kuuluu, Matkareitti".
- **Batch view**: answers given per line are shown with the unified item, so they can be checked later.
  Re-asking is done by rolling back the batch, as with one-off answers.

## API

- `GET /projects/:id/questions`, `POST /projects/:id/questions`, `PUT /projects/:id/questions/:questionId`,
  `DELETE /projects/:id/questions/:questionId`, with request and response schemas under `schema/projects/`.
- Saving a rule (`POST`/`PUT /flow-plans/:id/rules`) validates that the ids in `ask` exist in the project of the
  flow plan.

## Other changes

- Fix the typo in `schema/Question.json`: `"$ret"` → `"$ref"` for `args`, and extend `QuestionArgs.json` with the
  args actually used (`flowPlanId`, `items`, `questions`, `destinationId`, `ticker`), so question args are
  validated.
- Skill `nordea-rules`: convert question-based Bookkeeper rules into rules asking project questions. Create the
  project questions from `config.questions` once (`Osakkaiden tägit` → `TAGS` with its `ask` options parsed from
  `[TR][KR]`, `Matkareitti` → `TEXT`, `Verkkokaupan ostoksen tyyppi` → `ACCOUNT` with the options resolved to
  account numbers, `Nordnet rahastovaihtoehdot` → `TAGS`), then attach them to the converted rules. Reuse
  existing questions of the project instead of creating duplicates.

## Tests

- Unit: merging answers into a result (tags appended without duplicates, `{?name}` replaced or appended, account
  replaced), validation of questions (options
  required for `TAGS` and `ACCOUNT`, name pattern).
- Unit, unify: a rule with `ask` and no answers leaves the line unprocessed and raises `RULE_QUESTIONS` together
  with unmatched lines; with answers the unified item has the merged result. One question attached to two rules
  is asked for lines of both.
- API (`testing/cypress/e2e/api/`): question CRUD, deleting a question in use is refused, saving a rule with
  `ask` ids of another project is refused.
- UI (`testing/cypress/e2e/ui/tito-rules.spec.cy.ts`): create a `TAGS` question, attach it to a rule, import,
  answer, check the tags of the delivered transaction; import again and check the default is pre-filled.
- Unit: a line with answers is not asked again after its question gets new options or the rule gets another
  question attached.

## Order of work

1. `RuleQuestion` table, schema and API, with tests.
2. `MappingResultView.ask`, `Setup.lineAnswers`, `Question` fix, `RULE_QUESTIONS` type, and the backend merge and
   collection of questions, with unit tests.
3. Questions panel for `RULE_QUESTIONS`.
4. Questions page, rule dialog section and preview note.
5. Defaults from previous answers.
6. Update the `nordea-rules` skill, create the Dataplug questions and convert the September Nordea rules
   (Onnibus, VR, Verkkokauppa.com).

## Decisions

- Questions are per project: shared by the flow plans of one project (company), not between projects, since tags
  and accounts belong to the company.
- Old matches are never asked again (see Answers).
