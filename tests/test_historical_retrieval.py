"""Run with python3 tests/test_historical_retrieval.py; no model dependencies needed."""
import ast
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / 'server/orbit_server/store.py').read_text()
tree = ast.parse(source)
store_class = next(n for n in tree.body if isinstance(n, ast.ClassDef))
search = next(n for n in store_class.body if isinstance(n, ast.FunctionDef) and n.name == 'search_evidence')
stem = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == '_stem')
namespace = {'re': re, '_WORD': re.compile(r'[a-z0-9]+'), 'Any': object}
exec(compile(ast.fix_missing_locations(ast.Module(body=[stem, search], type_ignores=[])), '<actual store search>', 'exec'), namespace)

class HistoricalRetrieval(unittest.TestCase):
    def setUp(self):
        self.store = type('Fixture', (), {})()
        self.store.evidence = json.loads((ROOT / 'server/data/research-library.json').read_text())['passages']

    def test_exact_record_with_natural_question(self):
        hits = namespace['search_evidence'](self.store, 'What was the heart rate for NASA-VITAL-001?', 4)
        self.assertIn('NASA-VITAL-001:', hits[0]['title'])
        for value in ['72 bpm', 'Prelaunch', 'Gordon Cooper', 'page 420']:
            self.assertIn(value, hits[0]['excerpt'])

    def test_subject_and_phase(self):
        hits = namespace['search_evidence'](self.store, 'Gordon Cooper prelaunch heart rate', 4)
        self.assertIn('NASA-VITAL-001:', hits[0]['title'])

    def test_shared_interpretation_guidance(self):
        guidance = (ROOT / 'server/orbit_server/evidence_guidance.py').read_text()
        for phrase in ['grouped protocol means', 'Missing fields are unknown', 'BTPS and STPD', 'PDF/page/table']:
            self.assertIn(phrase, guidance)
        for file in ['voice.py', 'onboard_library.py']:
            self.assertIn('HISTORICAL_GUIDANCE', (ROOT / 'server/orbit_server' / file).read_text())

if __name__ == '__main__':
    unittest.main()
