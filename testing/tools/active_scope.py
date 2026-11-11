"""Single current-scope contract. Historical 298-case artifacts are read-only."""
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]


def load_active_scope(root=ROOT):
    path=Path(root)/'testing/data/active-test-scope.json'
    if not path.is_file():return None
    scope=json.loads(path.read_text('utf-8'))
    if not isinstance(scope,dict) or scope.get('schemaVersion')!=1 or not isinstance(scope.get('ids'),list) or len(scope['ids'])!=scope.get('caseCount'):
        raise ValueError('Invalid active test scope')
    if not all(isinstance(i,str) and re.fullmatch(r'CB-PW-[A-Z]+-\d{3}',i) for i in scope['ids']) or len(set(scope['ids']))!=scope['caseCount']:
        raise ValueError('Invalid active scope membership')
    for field in ['ledger','mapping','readiness']:
        name=scope.get(field)
        if not isinstance(name,str) or '\\' in name or ':' in name or '..' in Path(name).parts or not (Path(root)/name).resolve().is_relative_to((Path(root)/'testing/reports').resolve()):
            raise ValueError('Invalid current report location: '+field)
    return scope


def refuse_historical_regeneration():
    if load_active_scope():
        raise SystemExit('Historical 298-case generator is frozen after Task 1. Use npm --prefix testing run audit / summary for current-scope validation/reporting. Historical reports must not be overwritten.')
