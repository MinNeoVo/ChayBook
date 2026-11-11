import hashlib,json,tempfile,unittest,zipfile
from pathlib import Path
from dashboard_data import Pipeline,ROOT,redact,safe_path,validate_cases,evidence_response
from active_scope import load_active_scope
SCOPE=load_active_scope()
CURRENT=ROOT/SCOPE['ledger']
TOTAL=SCOPE['caseCount']
SQL_REQUIRED=sum(c['sql']['required'] for c in json.loads(CURRENT.read_text('utf-8')))

class DashboardPipelineTests(unittest.TestCase):
    def current_fixture(self,root):
        r=root/'testing/reports';d=root/'testing/data';r.mkdir(parents=True);d.mkdir(parents=True)
        row=json.loads(CURRENT.read_text('utf-8'))[0]
        scope=dict(SCOPE,ids=[row['id']],caseCount=1)
        (d/'active-test-scope.json').write_text(json.dumps(scope),'utf-8')
        (root/scope['ledger']).write_text(json.dumps([row]),'utf-8')
        (root/scope['mapping']).write_text(json.dumps([{'id':row['id'],'automation':[],'preparedSqlAutomation':[]}]),'utf-8')
        (root/scope['readiness']).write_text('{}','utf-8')
        return scope
    def test_corrupt_active_manifest_retains_complete_unknown_payload(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'.tmp') as directory:
            root=Path(directory);self.current_fixture(root)
            (root/'testing/data/active-test-scope.json').write_text('{bad','utf-8')
            data=Pipeline(root).build()
            self.assertEqual('UNKNOWN',data['caseValidation']);self.assertEqual('NOT_VERIFIED',data['summary']['verdict'])
            for name in ['cases','runs','defects','acceptance','decisions','blockers']:self.assertIsInstance(data[name],list)
    def test_missing_current_mapping_does_not_reuse_historical_locations(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'.tmp') as directory:
            root=Path(directory);scope=self.current_fixture(root)
            # Corrupt only the owned temporary fixture; never repository reports.
            (root/scope['mapping']).write_text('{bad','utf-8')
            data=Pipeline(root).build()
            self.assertEqual('UNKNOWN',data['mappingValidation']);self.assertEqual('NOT_VERIFIED',data['summary']['verdict'])
    def test_new_case_ledger_cannot_fall_back_when_manifest_disappears(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'.tmp') as directory:
            root=Path(directory);r=root/'testing/reports';r.mkdir(parents=True)
            (r/'current-case-results.json').write_text('[]','utf-8');(r/'sprint3-final-traceability.json').write_text(CURRENT.read_text('utf-8'),'utf-8')
            data=Pipeline(root).build();self.assertEqual('UNKNOWN',data['caseValidation']);self.assertEqual([],data['cases'])
    def test_active_scope_refuses_outside_report_paths(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'.tmp') as directory:
            root=Path(directory);scope=self.current_fixture(root);scope['ledger']='Back_End/pom.xml'
            (root/'testing/data/active-test-scope.json').write_text(json.dumps(scope),'utf-8')
            with self.assertRaises(ValueError):load_active_scope(root)
    def test_build_has_no_invented_playwright_or_case_results(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'.tmp') as directory:
            root=Path(directory);folder=root/'testing/reports/evidence/core-testing-task2/dashboard-build';folder.mkdir(parents=True)
            (folder/'command.json').write_text('{"kind":"build"}','utf-8');(folder/'run.exit').write_text('0','utf-8')
            run=Pipeline(root).run(folder)
            self.assertEqual('Vite build',run['framework']);self.assertEqual({},run['counts']);self.assertFalse(run['verified'])
            self.assertEqual('CHECK_COMPLETED_WITHOUT_CASE_RESULTS',run['runStatus'])
    def test_current_sql_gate_evidence_is_in_normalized_allowlist(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'.tmp') as directory:
            root=Path(directory);scope=self.current_fixture(root)
            evidence='testing/reports/sql-observation.json';(root/evidence).write_text('{"sqlConnections":0,"gateB":"BLOCKED"}','utf-8')
            (root/scope['readiness']).write_text(json.dumps({'sql':{'gateAssessment':{'evidence':[evidence]}}}),'utf-8')
            p=Pipeline(root);data=p.build();self.assertEqual([],data['sql']['gateEvidence'])
            # Reduced active-suite data intentionally omits historical SQL evidence from its API allowlist.
            with self.assertRaises(ValueError):evidence_response(evidence,p)
    def test_real_ledger_has_original_unique_ids(self):
        rows=json.loads(CURRENT.read_text('utf-8'));validate_cases(rows);self.assertEqual(TOTAL,len({x['id'] for x in rows}))
    def test_duplicates_and_invalid_schema_never_grant_pass(self):
        row=json.loads(CURRENT.read_text('utf-8'))[0]
        with self.assertRaises(ValueError):validate_cases([row,row])
        with self.assertRaises(ValueError):validate_cases([dict(row,acceptanceStatus='passed')])
    def test_missing_and_corrupt_ledger_remain_unknown(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'.tmp') as directory:
            root=Path(directory);r=root/'testing/reports';r.mkdir(parents=True)
            p=Pipeline(root);self.assertEqual('UNKNOWN',p.build()['caseValidation']);self.assertTrue(p.warnings)
            (r/'sprint3-final-traceability.json').write_text('{invalid','utf-8');data=Pipeline(root).build();self.assertEqual([],data['cases']);self.assertEqual('NOT_VERIFIED',data['summary']['verdict'])
    def test_corrupt_newer_ledger_does_not_fall_back_to_green_history(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'.tmp') as directory:
            root=Path(directory);r=root/'testing/reports';r.mkdir(parents=True)
            (r/'sprint3-final-traceability.json').write_text(CURRENT.read_text('utf-8'),'utf-8');(r/'testing-system-case-results.json').write_text('{bad','utf-8');self.assertEqual('UNKNOWN',Pipeline(root).build()['caseValidation'])
    def test_traversal_and_outside_evidence_are_refused(self):
        for p in ['../Back_End/pom.xml','testing/reports/../../Back_End/pom.xml','C:/Windows/win.ini','testing\\reports\\x','/absolute']:
            with self.assertRaises(ValueError):safe_path(p)
    def test_redaction_removes_credentials_tokens_and_target(self):
        sample='password="supersecret" api_key="hidden-key" CHAYBOOK_TOKEN=captured; jdbc:sqlserver://private-target;password=hidden Bearer abc.def.ghi';value=redact(sample)
        for secret in ['supersecret','hidden-key','captured','private-target','abc.def.ghi']:self.assertNotIn(secret,value)
    def test_incomplete_case_set_is_not_accepted(self):
        rows=json.loads(CURRENT.read_text('utf-8'))
        with self.assertRaises(ValueError):validate_cases(rows[:-1])
    def test_escaped_json_and_unquoted_otp_are_redacted(self):
        for sample in ['OTP=932710',r'{\"resetToken\":\"private-value\"}',r'{\"password\":\"hidden-value\"}']:
            value=redact(sample)
            for secret in ['932710','private-value','hidden-value']:self.assertNotIn(secret,value)
    def test_launcher_failure_is_preserved_without_invented_test_instances(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'.tmp') as directory:
            root=Path(directory);folder=root/'testing/reports/evidence/testing-system/backend-failed';folder.mkdir(parents=True)
            (folder/'command.json').write_text('{}','utf-8');(folder/'run.exit').write_text('1','utf-8');run=Pipeline(root).run(folder)
            self.assertEqual('FAILED_WITHOUT_TESTS',run['runStatus']);self.assertEqual({},run['counts']);self.assertFalse(run['verified'])
    def test_real_pipeline_separates_run_counts_and_sql_acceptance(self):
        data=Pipeline().build();self.assertEqual(TOTAL,len(data['cases']));self.assertEqual([],data['runs']);self.assertEqual(SQL_REQUIRED,data['sql']['required'])
        self.assertEqual('PASS',data['mappingValidation'])
        self.assertEqual('VERIFIED',data['junitCI']['status']);self.assertTrue(data['junitCI']['verified']);self.assertEqual(127,data['junitCI']['counts']['executions'])
        for case in data['cases']:self.assertIn('currentAutomation',case)
        original={x['id']:x['original'] for x in json.loads(CURRENT.read_text('utf-8'))}
        for case in data['cases']:self.assertEqual(original[case['id']],case['original'])
    def test_junit_ci_missing_or_corrupt_snapshot_is_not_verified(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'.tmp') as directory:
            root=Path(directory);self.current_fixture(root);snapshot=root/'testing/reports/evidence/ci/junit-ci-verified.json';snapshot.parent.mkdir(parents=True)
            self.assertEqual('NOT VERIFIED',Pipeline(root).build()['junitCI']['status'])
            snapshot.write_text('{bad','utf-8');self.assertEqual('NOT VERIFIED',Pipeline(root).build()['junitCI']['status'])
    def test_junit_ci_requires_verified_provenance_and_matching_artifact(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'.tmp') as directory:
            root=Path(directory);self.current_fixture(root);artifact=root/'testing/reports/evidence/ci/run-123/TEST-Example.xml';artifact.parent.mkdir(parents=True)
            artifact.write_text('<testsuite name="Example" tests="2" failures="0" errors="0" skipped="0"><testcase name="a"/><testcase name="b"/></testsuite>','utf-8')
            archive=root/'testing/reports/evidence/ci/run-123/junit-surefire-123-backend.zip'
            with zipfile.ZipFile(archive,'w') as z:z.write(artifact,artifact.name)
            metadata={'source':'GitHub Actions REST API','run':{'id':123,'repository':'MinNeoVo/ChayBook','name':'ChayBook CI','event':'push','conclusion':'success','head_branch':'ci/test','head_sha':'a'*40,'updated_at':'2026-11-06T00:00:00Z','html_url':'https://github.com/MinNeoVo/ChayBook/actions/runs/123'},'jobs':[{'name':'Backend - Test','conclusion':'success'},{'name':'Frontend - Build','conclusion':'success'}],'artifact':{'name':'junit-surefire-123-backend','expired':False,'size_in_bytes':archive.stat().st_size}}
            metadata_file=root/'testing/reports/evidence/ci/run-123/github-actions-run-123.json';metadata_file.write_text(json.dumps(metadata),'utf-8')
            relative='testing/reports/evidence/ci/run-123/TEST-Example.xml';snapshot={'schemaVersion':2,'verification':{'status':'VERIFIED','repository':'MinNeoVo/ChayBook','workflow':'ChayBook CI','runId':'123','commitSha':'a'*40,'completedAt':'2026-11-06T00:00:00Z','sourceUrl':'https://github.com/MinNeoVo/ChayBook/actions/runs/123','branch':'ci/test','event':'push'},'historicalReference':{'pullRequest':83,'relationship':'HISTORICAL_REFERENCE_ONLY'},'provenance':{'metadataPath':'testing/reports/evidence/ci/run-123/github-actions-run-123.json','metadataSha256':hashlib.sha256(metadata_file.read_bytes()).hexdigest()},'archive':{'path':'testing/reports/evidence/ci/run-123/junit-surefire-123-backend.zip','sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'bytes':archive.stat().st_size},'artifacts':[{'path':relative,'sha256':hashlib.sha256(artifact.read_bytes()).hexdigest()}],'expected':{'executions':2,'classes':1,'failures':0,'errors':0,'skipped':0}}
            location=root/'testing/reports/evidence/ci/junit-ci-verified.json';location.write_text(json.dumps(snapshot),'utf-8');data=Pipeline(root).build()['junitCI']
            self.assertEqual('VERIFIED',data['status']);self.assertEqual(2,data['counts']['passed']);self.assertIn(relative,data['evidence'])
            snapshot['expected']['executions']=127;location.write_text(json.dumps(snapshot),'utf-8');self.assertEqual('NOT VERIFIED',Pipeline(root).build()['junitCI']['status'])
if __name__=='__main__':unittest.main()
