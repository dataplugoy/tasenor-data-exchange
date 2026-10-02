"""
Show how the Bookkeeper TITO importer booked earlier transactions.

Usage: python3 .claude/skills/nordea-rules/history.py <regex> [--field Saaja/Maksaja]

Searches the import runs (*.json) next to the importer config for transactions whose field (default: counterparty,
or any of counterparty, message and transaction type with --field any) matches the regex, and prints the date, amount,
answers given to the importer questions and the final postings (account, amount in euros).
"""
import glob
import json
import os
import re
import sys

DIR = '/home/wigy/projects/tasenor-backup/bookkeeper/staging/dataplug/export/importers/Nordea TITO'


def transactions():
    for path in sorted(glob.glob(os.path.join(DIR, '2*.json'))):
        run = json.load(open(path))
        state = (run.get('steps') or [{}])[-1].get('state') or {}
        answers = (run.get('config') or {}).get('answers') or {}
        columns = {}
        for name, data in (state.get('files') or {}).items():
            for line in data['lines']:
                columns[(name, line['line'])] = line.get('columns', {})
        for sid, segment in (state.get('segments') or {}).items():
            fields = {}
            for ref in segment['lines']:
                c = columns.get((ref['file'], ref['number']), {})
                if str(c.get('Tietuetunnus')) in ('10', '11'):
                    for k, v in c.items():
                        if v not in ('', None) and k not in fields:
                            fields[k] = v
            postings = []
            for entry in (state.get('result') or {}).get(sid) or []:
                for tx in entry.get('transactions') or []:
                    postings.append([(e.get('account'), e.get('amount') / 100) for e in tx.get('entries', [])])
            message = ' '.join(str(fields.get(k, '')) for k in ['Viesti-1', 'Viesti-2', 'Viesti-3', 'Lisätieto-1']).strip()
            yield {
                'date': segment.get('time', '')[:10],
                'amount': fields.get('Tapahtuman rahamäärä'),
                'counterparty': fields.get('Saaja/Maksaja', ''),
                'type': fields.get('Seliteteksti', ''),
                'reference': fields.get('Viite', ''),
                'message': message,
                'answer': answers.get(sid),
                'postings': postings,
            }


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    regex = re.compile(sys.argv[1], re.I)
    field = sys.argv[sys.argv.index('--field') + 1] if '--field' in sys.argv else 'counterparty'
    for tx in transactions():
        values = [tx['counterparty'], tx['message'], tx['type']] if field == 'any' else [str(tx.get(field, ''))]
        if any(regex.search(v or '') for v in values):
            answer = json.dumps(tx['answer'], ensure_ascii=False)[:200] if tx['answer'] else '-'
            print(f"{tx['date']} {tx['amount']:>10} {tx['counterparty'][:30]:30} | {tx['message'][:60]} | answer: {answer} | postings: {tx['postings']}")


main()
