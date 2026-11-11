"""Read-only artifact normalization. No shell, SQL, provider or legacy generator execution."""
import copy, hashlib, json, re, zipfile, xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from active_scope import load_active_scope

ROOT=Path(__file__).resolve().parents[2]
REPORTS=ROOT/'testing/reports'
STATUSES={'PASS_FULL_ACCEPTANCE','PASS_AT_TESTED_LAYER','PARTIAL','BLOCKED_SQL','BLOCKED_CROSS_BROWSER','BLOCKED_PROVIDER','REQUIRES_CLARIFICATION','FEATURE_NOT_IMPLEMENTED','FAIL_PRODUCT','FAIL_TEST'}
ORIGINAL_FIELDS=set('id module feature scenario preconditions steps expected type priority source'.split())

def redact(s):
    s=re.sub(r'\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b','[SIGNED_TOKEN_REDACTED]',s)
    s=re.sub(r'jdbc:[^\s"\'<>]+','[JDBC_TARGET_REDACTED]',s)
    s=re.sub(r'\b[A-Za-z]+123!','[SYNTHETIC_CREDENTIAL_REDACTED]',s)
    s=re.sub(r'(?i)(Bearer\s+)[A-Za-z0-9._~-]+',r'\1[REDACTED]',s)
    s=re.sub(r'(?i)((?:password|api[-_]?key|api[-_]?secret|jwt[-_.]?secret|resetToken|otp|authorization|set-cookie)\s*["\']?\s*[:=]\s*)(["\'])(.*?)\2',r'\1"[REDACTED]"',s)
    s=re.sub(r'(?i)((?:CHAYBOOK_TOKEN|CHAYBOOK_AI_GUEST|CHAYBOOK_AI_CONV_[\w-]+)=)[^;\s"<>]+',r'\1[REDACTED]',s)
    s=re.sub(r'(?i)((?:spring\.datasource\.(?:password|username|url)|[\w.-]*(?:API_KEY|API_SECRET|DB_PASSWORD|SCHEMA_PASSWORD|JWT_SECRET))\s*=)[^\r\n]+',r'\1[REDACTED]',s)
    s=re.sub(r'(?<=["\'])(?:123456|654321)(?=["\'])','[SYNTHETIC_OTP_REDACTED]',s)
    s=re.sub(r'(?i)(\b(?:otp|code)\s*[:=]\s*)\d{6}\b',r'\1[REDACTED]',s)
    s=re.sub(r'(?i)((?:password|password_hash|api[-_]?key|api[-_]?secret|jwt[-_.]?secret|resetToken|otp|authorization|set-cookie)\\?"\s*:\s*\\?")[^"\r\n]*?(?=\\?")',r'\1[REDACTED]',s)
    return s

def clean(value):
    if isinstance(value,str):return redact(value)
    if isinstance(value,list):return [clean(v) for v in value]
    if isinstance(value,dict):return {k:(copy.deepcopy(v) if k=='original' and isinstance(v,dict) and set(v)==ORIGINAL_FIELDS else '[REDACTED]' if re.fullmatch(r'(?i)(?:password|password_hash|api[-_]?key|api[-_]?secret|jwt[-_.]?secret|resetToken|otp|authorization|set-cookie)',k) else clean(v)) for k,v in value.items()}
    return value

def safe_path(relative,root=ROOT,base=None):
    if not isinstance(relative,str) or '\\' in relative or ':' in relative or '\x00' in relative:raise ValueError('Refused artifact path')
    parts=Path(relative).parts
    if Path(relative).is_absolute() or '..' in parts:raise ValueError('Refused artifact traversal')
    p=(root/relative).resolve();allowed=(base or root/'testing/reports').resolve()
    if not p.is_relative_to(allowed) or not p.is_file():raise ValueError('Unknown/outside artifact')
    return p

def decode(p):
    b=p.read_bytes()
    if len(b)>32*1024*1024:raise ValueError('Artifact too large for safe text viewer')
    return b.decode('utf-16' if b.startswith(b'\xff\xfe') else 'utf-8-sig',errors='replace')

def validate_cases(rows, expected_ids=None, root=ROOT):
    if not isinstance(rows,list):raise ValueError('Case ledger must be an array')
    seen=set()
    for x in rows:
        if not isinstance(x,dict) or not re.fullmatch(r'CB-PW-[A-Z]+-\d{3}',x.get('id','')):raise ValueError('Invalid workbook ID')
        if x['id'] in seen:raise ValueError('Duplicate workbook ID: '+x['id'])
        seen.add(x['id'])
        if x.get('acceptanceStatus') not in STATUSES or x.get('priority') not in {'P0','P1','P2'}:raise ValueError('Invalid acceptance/priority')
        if not isinstance(x.get('original'),dict) or any(not isinstance(x['original'].get(k),str) for k in 'id module feature scenario preconditions steps expected type priority source'.split()):raise ValueError('Original workbook fields missing')
        if set(x['original'])!=ORIGINAL_FIELDS:raise ValueError('Unexpected original workbook fields')
        if x['original']['id']!=x['id']:raise ValueError('Original workbook ID mismatch')
        if x['original']['priority']!=x['priority'] or x['original']['module']!=x['module']:raise ValueError('Original/current case classification mismatch')
        for key in ('evidence','executionLayers','remainingUnverifiedClauses'):
            if not isinstance(x.get(key),list):raise ValueError('Invalid case '+key)
    if expected_ids is None:
        scope=load_active_scope(root)
        expected_ids=scope['ids'] if scope else None
    if expected_ids is not None:
        if seen!=set(expected_ids) or len(rows)!=len(expected_ids):raise ValueError('Ledger does not match active workbook scope')
    elif len(seen)!=298:raise ValueError('Expected historical 298-case workbook scope')
    return rows

class Pipeline:
    def __init__(self,root=ROOT):
        self.root=Path(root).resolve();self.reports=self.root/'testing/reports';self.warnings=[];self.hashes={};self.evidence=set()
    def relative(self,p):return p.relative_to(self.root).as_posix()
    def load(self,p,default=None,required=True):
        try:
            if not p.resolve().is_relative_to(self.reports.resolve()):raise ValueError('Artifact outside reports')
            value=json.loads(decode(p))
            if default is not None and not isinstance(value,type(default)):raise ValueError('Unexpected artifact schema type')
            return value
        except (OSError,ValueError,TypeError) as error:
            if required:self.warnings.append(self.relative(p)+': UNKNOWN / '+type(error).__name__)
            return copy.deepcopy(default)
    def digest(self,p):
        key=str(p)
        if key not in self.hashes:self.hashes[key]=hashlib.sha256(p.read_bytes()).hexdigest() if p.is_file() else None
        return self.hashes[key]
    def objects(self,value,field):
        if not isinstance(value,list) or any(not isinstance(x,dict) for x in value):
            self.warnings.append(field+': UNKNOWN invalid row schema');return []
        return value
    def tools(self,c):
        layers=c.get('executionLayers',[]);out=[]
        if any(l in layers for l in ['UI_MOCK','CHROMIUM_UI_MOCK','BROWSER_BACKEND_FAKE_DB']):out.append('Playwright')
        if any(l in layers for l in ['SERVICE_UNIT_OR_STATIC','HTTP_IN_PROCESS']):out.append('JUnit')
        if 'HTTP_IN_PROCESS' in layers:out+=['MockMvc','HTTP']
        if c.get('sql',{}).get('required'):out.append('SQL — prepared/blocked')
        # Mockito presence is classified from actual mapped source imports, not assumed for every JUnit case.
        for p in c.get('automation',[]):
            source=self.root/p.get('source','')
            if source.is_file() and source.suffix=='.java' and 'mockito' in source.read_text('utf-8',errors='replace').lower():out.append('Mockito')
        return sorted(set(out))
    def source_status(self,folder):
        manifest=self.load(folder/'execution-source-hashes.json',{},False)
        if not manifest:return 'NOT_VERIFIED',None
        if not isinstance(manifest,dict):return 'NOT_VERIFIED',None
        captured=hashlib.sha256(json.dumps(manifest,sort_keys=True).encode()).hexdigest()[:16]
        try:
            for name,digest in manifest.items():
                p=(self.root/name).resolve()
                if not p.is_relative_to(self.root) or '..' in Path(name).parts or self.digest(p)!=digest:return 'SOURCE_CHANGED',captured
            return 'MATCHES_CURRENT_SOURCE',captured
        except (OSError,ValueError,TypeError):return 'NOT_VERIFIED',None
    def run(self,folder):
        tests=[];timestamps=[];framework='JUnit';ev=[]
        for p in sorted(folder.glob('TEST-*.xml')):
            try:
                suite=ET.fromstring(decode(p));timestamps.append(suite.get('timestamp'));ev.append(self.relative(p))
                for x in suite.findall('testcase'):
                    failure=x.find('failure')
                    if failure is None:failure=x.find('error')
                    status='SKIP' if x.find('skipped') is not None else 'FAIL' if failure is not None else 'PASS'
                    tests.append({'name':x.get('name'),'className':x.get('classname'),'status':status,'durationSeconds':float(x.get('time','0')),
                        'failure':((failure.get('message','')+'\n'+(failure.text or ''))[:5000]) if failure is not None else None,'evidence':[self.relative(p)],'tools':['JUnit']})
            except (OSError,ValueError,ET.ParseError):self.warnings.append(self.relative(p)+': UNKNOWN corrupt JUnit')
        if (folder/'results.json').is_file() and not tests:
            framework='Playwright';p=folder/'results.json';d=self.load(p,{});ev.append(self.relative(p))
            if not isinstance(d,dict) or not isinstance(d.get('suites'),list):self.warnings.append(self.relative(p)+': UNKNOWN invalid Playwright schema');d={}
            timestamps.append(d.get('stats',{}).get('startTime'))
            def walk(suites):
                for suite in suites:
                    for spec in suite.get('specs',[]):
                        for t in spec.get('tests',[]):
                            for result in t.get('results',[]):
                                attachments=[]
                                for a in result.get('attachments',[]):
                                    if a.get('path'):
                                        ap=Path(a['path']);ap=ap if ap.is_absolute() else self.root/'testing'/ap
                                        if ap.is_file() and ap.resolve().is_relative_to(self.reports.resolve()):attachments.append(self.relative(ap.resolve()))
                                tests.append({'name':spec.get('title','UNKNOWN'),'status':{'passed':'PASS','failed':'FAIL','timedOut':'FAIL','interrupted':'FAIL','skipped':'SKIP'}.get(result.get('status'),'UNKNOWN'),
                                    'durationSeconds':result.get('duration',0)/1000,'retry':result.get('retry'),'engine':t.get('projectName') or ('Chromium (fixture config)' if 'browser' in folder.name or 'ui-' in folder.name else 'NOT_VERIFIED'),
                                    'failure':'\n'.join(x.get('message','') for x in result.get('errors',[]))[:5000],'evidence':[self.relative(p)]+attachments,'tools':['Playwright']})
                    walk(suite.get('suites',[]))
            walk(d.get('suites',[]))
        if not tests and not (folder/'command.json').is_file():return None
        command=self.load(folder/'command.json',{},False) or {}
        if not tests:framework={'pipeline':'Python unittest','build':'Vite build'}.get(command.get('kind'),'JUnit' if folder.name.startswith('backend-') else 'Playwright')
        counts=dict(Counter(x['status'] for x in tests));status,digest=self.source_status(folder)
        summary=self.load(folder/'run-summary.json',{},False) or {};timestamp=next((x for x in timestamps if x),None)
        launched=self.load(folder/'launched.json',{},False) or {}
        if not timestamp and isinstance(launched.get('startedEpoch'),(float,int)):timestamp=datetime.fromtimestamp(launched['startedEpoch'],timezone.utc).isoformat()
        for name in ['command.json','execution-source-hashes.json','run-summary.json','run.log','launched.json']:
            if (folder/name).is_file():ev.append(self.relative(folder/name))
        try:exit_code=int(decode(folder/'run.exit').strip())
        except (OSError,ValueError):exit_code=None
        scope=self.load(folder/'scope.json',{},False) or {}
        return {'id':self.relative(folder).removeprefix('testing/reports/evidence/'),'framework':framework,'timestamp':timestamp,'sourceStatus':status,'sourceDigest':digest,'scope':scope,
            'counts':counts,'durationSeconds':summary.get('elapsedSeconds'),'exit':exit_code,'tests':tests,'evidence':ev,
            'runStatus':('EXECUTED' if tests else 'FAILED_WITHOUT_TESTS' if exit_code is not None and exit_code!=0 else 'CHECK_COMPLETED_WITHOUT_CASE_RESULTS' if exit_code==0 and command.get('kind') in {'pipeline','build'} else 'NOT_VERIFIED'),
            'verified':bool(tests) and exit_code==0 and not counts.get('FAIL') and not counts.get('UNKNOWN') and status=='MATCHES_CURRENT_SOURCE',
            'description':'Execution artifact snapshot. Counts are instances, never unique workbook acceptance. Mockito/MockMvc classification is available at mapped case/source level.'}
    def junit_ci_not_verified(self,reason):
        return {'status':'NOT VERIFIED','verified':False,'reason':reason,'counts':None,'source':None,'evidence':[]}
    def junit_ci(self):
        """Load only a provenance-attested GitHub Actions snapshot; local Surefire XML is never a CI source."""
        snapshot_relative='testing/reports/evidence/ci/junit-ci-verified.json'
        snapshot=self.root/snapshot_relative
        if not snapshot.is_file():
            return self.junit_ci_not_verified('No provenance-verified GitHub Actions JUnit CI snapshot is available.')
        try:
            value=json.loads(decode(snapshot))
            if not isinstance(value,dict) or value.get('schemaVersion')!=2:raise ValueError('snapshot schema')
            verification=value.get('verification')
            if not isinstance(verification,dict) or verification.get('status')!='VERIFIED':raise ValueError('verification status')
            required=('repository','workflow','runId','commitSha','completedAt','sourceUrl','branch','event')
            if any(not verification.get(key) for key in required):raise ValueError('verification metadata')
            if verification['repository']!='MinNeoVo/ChayBook' or verification['event'] not in {'push','workflow_dispatch'}:raise ValueError('unexpected source')
            run_id=str(verification['runId'])
            if not re.fullmatch(r'\d+',run_id):raise ValueError('run id')
            if not re.fullmatch(r'[0-9a-fA-F]{40}',str(verification['commitSha'])):raise ValueError('commit sha')
            datetime.fromisoformat(str(verification['completedAt']).replace('Z','+00:00'))
            expected_url=f'https://github.com/MinNeoVo/ChayBook/actions/runs/{run_id}'
            if verification['sourceUrl']!=expected_url:raise ValueError('source url')
            historical=value.get('historicalReference')
            if not isinstance(historical,dict) or historical.get('pullRequest')!=83 or historical.get('relationship')!='HISTORICAL_REFERENCE_ONLY':raise ValueError('historical reference')
            provenance=value.get('provenance')
            if not isinstance(provenance,dict) or set(provenance)!={'metadataPath','metadataSha256'}:raise ValueError('provenance schema')
            metadata_path=provenance['metadataPath']
            if not isinstance(metadata_path,str) or not metadata_path.startswith(f'testing/reports/evidence/ci/run-{run_id}/') or not metadata_path.endswith('.json'):raise ValueError('metadata location')
            if not re.fullmatch(r'[0-9a-f]{64}',str(provenance['metadataSha256'])):raise ValueError('metadata identity')
            metadata_file=safe_path(metadata_path,self.root)
            if self.digest(metadata_file)!=provenance['metadataSha256']:raise ValueError('metadata digest')
            metadata=json.loads(decode(metadata_file));run=metadata.get('run',{});jobs=metadata.get('jobs',[]);artifact_metadata=metadata.get('artifact',{})
            if metadata.get('source')!='GitHub Actions REST API' or not isinstance(run,dict) or not isinstance(jobs,list) or not isinstance(artifact_metadata,dict):raise ValueError('metadata schema')
            if str(run.get('id'))!=run_id or run.get('repository')!=verification['repository'] or run.get('name')!=verification['workflow'] or run.get('event')!=verification['event'] or run.get('head_branch')!=verification['branch'] or str(run.get('head_sha','')).lower()!=str(verification['commitSha']).lower() or run.get('updated_at')!=verification['completedAt'] or run.get('html_url')!=verification['sourceUrl'] or run.get('conclusion')!='success':raise ValueError('metadata run mismatch')
            completed={job.get('name'):job.get('conclusion') for job in jobs if isinstance(job,dict)}
            if completed.get('Backend - Test')!='success' or completed.get('Frontend - Build')!='success':raise ValueError('metadata jobs')
            archive=value.get('archive')
            if not isinstance(archive,dict) or set(archive)!={'path','sha256','bytes'}:raise ValueError('archive schema')
            archive_path=archive['path']
            if not isinstance(archive_path,str) or not archive_path.startswith(f'testing/reports/evidence/ci/run-{run_id}/') or not archive_path.endswith('.zip') or not re.fullmatch(r'[0-9a-f]{64}',str(archive['sha256'])) or type(archive['bytes']) is not int or archive['bytes']<1:raise ValueError('archive identity')
            archive_file=safe_path(archive_path,self.root)
            if self.digest(archive_file)!=archive['sha256'] or archive_file.stat().st_size!=archive['bytes']:raise ValueError('archive digest')
            if artifact_metadata.get('name')!=f'junit-surefire-{run_id}-backend' or artifact_metadata.get('expired') is not False or artifact_metadata.get('size_in_bytes')!=archive['bytes']:raise ValueError('metadata artifact mismatch')
            artifacts=value.get('artifacts')
            expected=value.get('expected')
            if not isinstance(artifacts,list) or not artifacts or not isinstance(expected,dict):raise ValueError('artifact schema')
            required_counts=('executions','classes','failures','errors','skipped')
            if any(type(expected.get(key)) is not int or expected[key]<0 for key in required_counts):raise ValueError('count schema')
            actual={'executions':0,'classes':0,'failures':0,'errors':0,'skipped':0};evidence=[snapshot_relative,metadata_path,archive_path]
            seen=set()
            for artifact in artifacts:
                if not isinstance(artifact,dict) or set(artifact)!={'path','sha256'}:raise ValueError('artifact fields')
                path=artifact['path']
                if not isinstance(path,str) or not path.startswith('testing/reports/evidence/ci/') or not path.endswith('.xml'):raise ValueError('artifact location')
                if path in seen or not re.fullmatch(r'[0-9a-f]{64}',str(artifact['sha256'])):raise ValueError('artifact identity')
                seen.add(path);p=safe_path(path,self.root)
                if self.digest(p)!=artifact['sha256']:raise ValueError('artifact digest')
                root=ET.fromstring(decode(p))
                suites=[root] if root.tag=='testsuite' else root.findall('./testsuite') if root.tag=='testsuites' else []
                if not suites:raise ValueError('JUnit XML schema')
                for suite in suites:
                    fields={key:suite.get(key) for key in ('tests','failures','errors','skipped')}
                    if not suite.get('name') or any(value is None or not str(value).isdigit() for value in fields.values()):raise ValueError('JUnit suite counters')
                    actual['classes']+=1
                    actual['executions']+=int(fields['tests']);actual['failures']+=int(fields['failures'])
                    actual['errors']+=int(fields['errors']);actual['skipped']+=int(fields['skipped'])
                evidence.append(path)
            if actual!=expected or actual['failures']+actual['errors']+actual['skipped']>actual['executions']:raise ValueError('JUnit count mismatch')
            return {'status':'VERIFIED','verified':True,'reason':None,
                'counts':dict(actual,passed=actual['executions']-actual['failures']-actual['errors']-actual['skipped']),
                'source':{'provider':'GitHub Actions','workflow':verification['workflow'],'runId':run_id,'commitSha':verification['commitSha'].lower(),'completedAt':verification['completedAt'],'branch':verification['branch'],'event':verification['event'],'url':verification['sourceUrl']},'historicalReference':historical,'evidence':evidence}
        except (OSError,ValueError,TypeError,json.JSONDecodeError,ET.ParseError):
            return self.junit_ci_not_verified('The GitHub Actions JUnit CI snapshot is missing, corrupt, or cannot be provenance-verified.')
    def collect_paths(self,value):
        if isinstance(value,str) and value.startswith('testing/reports/'):
            try:
                p=safe_path(value.split('#')[0],self.root)
                self.evidence.add(self.relative(p))
            except ValueError:pass
        elif isinstance(value,list):
            for v in value:self.collect_paths(v)
        elif isinstance(value,dict):
            for v in value.values():self.collect_paths(v)
    def build(self):
        baseline=self.reports/'sprint3-final-traceability.json';latest=self.reports/'testing-system-case-results.json'
        scope=None;scope_error=None
        try:
            scope=load_active_scope(self.root)
            if scope is None and (self.reports/'current-case-results.json').exists():raise ValueError('Active manifest missing; refusing historical fallback')
        except (OSError,ValueError,TypeError) as error:
            self.warnings.append('Active scope: UNKNOWN / '+type(error).__name__)
            scope_error=str(error)
        reduced_suite=bool(scope and scope.get('suiteMode')=='PASS_FULL_ACCEPTANCE_ONLY')
        chosen=self.root/scope['ledger'] if scope else latest if latest.is_file() else baseline
        rows=[] if scope_error else self.load(chosen,[])
        validation='PASS'
        try:validate_cases(rows,scope['ids'] if scope else None,root=self.root)
        except (ValueError,TypeError) as error:self.warnings.append(str(error));rows=[];validation='UNKNOWN'
        # Missing/corrupt latest ledger never silently falls back to an older green snapshot.
        if not rows:validation='UNKNOWN'
        for c in rows:c['tools']=self.tools(c)
        acceptance=self.load(self.reports/'sprint3-acceptance-matrix.json',{}) or {}
        defects=self.load(self.reports/'sprint3-defect-summary.json',{}) or {}
        blockers=self.load(self.reports/'sprint3-open-blockers.json',{}) or {}
        decisions=self.load(self.reports/'evidence/sprint3-final/contract-decision-register.json',[]) or []
        readiness=self.load(self.root/scope['readiness'] if scope else self.reports/'testing-system-readiness.json',{},False) or {}
        if isinstance(readiness.get('acceptanceCriteria'),list):acceptance={'criteria':readiness['acceptanceCriteria']}
        # A closed gap must not remain an open blocker merely because historical Group7 listed it.
        current={c['id']:c for c in rows}
        mapping_status='NOT_CONFIGURED'
        if scope:
            mapping=self.load(self.root/scope['mapping'],[])
            try:
                if not isinstance(mapping,list) or [x['id'] for x in mapping]!=scope['ids']:raise ValueError('Mapping ID/order does not match current scope')
                for x in mapping:
                    if not isinstance(x.get('automation'),list) or not isinstance(x.get('preparedSqlAutomation'),list):raise ValueError('Invalid current mapping schema')
                    if x['id'] in current:current[x['id']]['currentAutomation']=x['automation'];current[x['id']]['currentSqlAutomation']=x['preparedSqlAutomation']
                mapping_status='PASS'
            except (KeyError,ValueError,TypeError):
                mapping_status='UNKNOWN';self.warnings.append('Current testcase mapping: UNKNOWN; historical anchors are not current source locations')
        blockers={'caseRows':[dict(b,status=current[b['id']]['acceptanceStatus'],reason=current[b['id']].get('blockingReason',[])) for b in self.objects(blockers.get('caseRows',[]),'blockers') if b.get('id') in current and current[b['id']]['acceptanceStatus']!='PASS_FULL_ACCEPTANCE']}
        runs=[]
        for group in ['group6','testing-system','core-testing-task2']:
            base=self.reports/'evidence'/group
            if base.is_dir():
                for folder in sorted(base.iterdir()):
                    if folder.is_dir():
                        run=self.run(folder)
                        if run:runs.append(run)
        runs.sort(key=lambda x:x.get('timestamp') or '',reverse=True)
        for run in runs:
            captured=run.get('scope',{})
            run['scopeStatus']='CURRENT_CORE' if scope and captured.get('ids')==scope['ids'] and captured.get('caseCount')==scope['caseCount'] else 'HISTORICAL_OR_UNATTESTED_SCOPE'
        manifest=self.load(self.reports/'evidence/group6/final-source-hashes.json',{}) or {};mismatches=[]
        for p,h in manifest.items():
            if not (self.root/p).resolve().is_relative_to(self.root) or self.digest(self.root/p)!=h:mismatches.append(p)
        prepared_methods={(p.get('source'),p.get('method')) for c in rows for p in c.get('preparedSqlAutomation',[])}
        executed_links=[p for c in rows for p in c.get('preparedSqlAutomation',[]) if p.get('executed') and p.get('execution')=='PASS_GATE_C_SQL_RUNTIME_2026-11-07']
        executed_methods={(p.get('source'),p.get('method')) for p in executed_links}
        attempted_links=[p for c in rows for p in c.get('preparedSqlAutomation',[]) if p.get('executed')]
        attempted_methods={(p.get('source'),p.get('method')) for p in attempted_links}
        error_links=[p for p in attempted_links if p.get('execution')=='ERROR_GATE_C_SQL_RUNTIME_2026-11-07']
        error_methods={(p.get('source'),p.get('method')) for p in error_links}
        p0_sql=[c for c in rows if c.get('priority')=='P0' and c.get('sql',{}).get('required')]
        gate_c_p0_complete=bool(p0_sql) and all(c.get('gateCIntegration',{}).get('status')=='PASS_FOR_MAPPED_SQL_ASSERTIONS' and c.get('sql',{}).get('pass') is True for c in p0_sql)
        remaining_sql=sum(bool(c.get('sql',{}).get('required') and not c.get('sql',{}).get('pass')) for c in rows)
        runtime_evidence='testing/reports/evidence/gate-c/s3g4_e59a50913259/p0-sql-ledger-reconciliation.json'
        acceptance_evidence='testing/reports/evidence/gate-c/s3g4_e59a50913259/p0-acceptance-reconciliation.json'
        p1_attempt_evidence='testing/reports/evidence/gate-c/s3g4_e59a50913259/p1-identity-batch-ledger-reconciliation.json'
        p1_run_evidence='testing/reports/evidence/gate-c/s3g4_e59a50913259/run-P1IdentityBatch.json'
        p1_recovery_evidence='testing/reports/evidence/gate-c/s3g4_e59a50913259/p1-identity-batch-operator-recovery-reconciliation.json'
        p1_recovery_run='testing/reports/evidence/gate-c/s3g4_e59a50913259/run-P1IdentityBatch-OperatorRecovery.json'
        p1_recovery_junit='testing/reports/evidence/gate-c/s3g4_e59a50913259/TEST-PersistenceSqlServerIT-P1IdentityBatch-OperatorRecovery.xml'
        p1_security_evidence='testing/reports/evidence/gate-c/s3g4_e59a50913259/p1-security-integrity-operator-recovery-reconciliation.json'
        p1_security_run='testing/reports/evidence/gate-c/s3g4_e59a50913259/run-P1SecurityIntegrityBatch-OperatorRecovery.json'
        p1_security_junit='testing/reports/evidence/gate-c/s3g4_e59a50913259/TEST-PersistenceSqlServerIT-P1SecurityIntegrityBatch-OperatorRecovery.xml'
        connection_probe_evidence='testing/reports/evidence/gate-c/s3g4_e59a50913259/run-JdbcMetadata.json'
        connection_probe_junit='testing/reports/evidence/gate-c/s3g4_e59a50913259/TEST-PersistenceSqlServerIT-JdbcMetadata.xml'
        recovery_probe_evidence='testing/reports/evidence/gate-c/s3g4_e59a50913259/run-JdbcMetadata-Recovery.json'
        recovery_probe_junit='testing/reports/evidence/gate-c/s3g4_e59a50913259/TEST-PersistenceSqlServerIT-JdbcMetadata-Recovery.xml'
        operator_probe_evidence='testing/reports/evidence/gate-c/s3g4_e59a50913259/run-JdbcMetadata-OperatorRecovery.json'
        operator_probe_junit='testing/reports/evidence/gate-c/s3g4_e59a50913259/TEST-PersistenceSqlServerIT-JdbcMetadata-OperatorRecovery.xml'
        gate_b_checkpoint='testing/reports/checkpoint-sql-gate-b-readiness.md'
        sql={'required':sum(bool(c.get('sql',{}).get('required')) for c in rows),'prepared':sum(bool(c.get('sql',{}).get('required') and c.get('sql',{}).get('prepared')) for c in rows),
            'executions':len(executed_methods),'mappingLinks':len(executed_links),'attemptedExecutions':len(attempted_methods),'attemptedMappingLinks':len(attempted_links),'errorMethods':len(error_methods),'errorMappingLinks':len(error_links),'remaining':remaining_sql,'level':1,
            'overallStatus':'PARTIAL' if gate_c_p0_complete and remaining_sql else 'PASS_AT_TESTED_LAYER' if gate_c_p0_complete else 'BLOCKED_SQL',
            'status':('Gate B COMPLETE; Gate C P0 SQL runtime COMPLETE (24 methods / 41 mapping links). Approved Windows-operator P1 batches passed (9 methods / 12 P1 mapping links); '+str(remaining_sql)+' SQL-dependent cases remain outside the executed scope.') if gate_c_p0_complete else 'No complete approved Gate C P0 runtime evidence is available in the current ledger.',
            'gates':'B COMPLETE; C P0 COMPLETE; C remaining scope PARTIAL' if gate_c_p0_complete else 'Gate C P0 evidence UNKNOWN',
            'gateEvidence':[p for p in [runtime_evidence,acceptance_evidence,p1_attempt_evidence,p1_run_evidence,p1_recovery_evidence,p1_recovery_run,p1_recovery_junit,p1_security_evidence,p1_security_run,p1_security_junit,connection_probe_evidence,connection_probe_junit,recovery_probe_evidence,recovery_probe_junit,operator_probe_evidence,operator_probe_junit,gate_b_checkpoint] if (self.root/p).is_file()],
            'definitions':len(prepared_methods) if scope else readiness.get('sql',{}).get('definitions',60),'anticipatedExecutions':None if scope else readiness.get('sql',{}).get('anticipatedExecutions',71)}
        product=[] if reduced_suite else sum((self.objects(defects.get(k,[]),k) for k in ['productDefects','group6TestAndReliabilityDefects','group7ReportingFindings']),[])
        if not reduced_suite:product+=self.objects(readiness.get('additionalDefects',[]),'current boundary observations')
        data={'schemaVersion':1,'generatedAt':datetime.now(timezone.utc).isoformat(),'caseValidation':validation,'mappingValidation':mapping_status,'cases':rows,'runs':runs,
            'latestVerifiedRun':None if reduced_suite else next(({k:v for k,v in x.items() if k!='tests'} for x in runs if x['verified']),None),
            'summary':{'acceptanceSource':self.relative(chosen),'verdict':readiness.get('releaseVerdict','NOT READY') if validation=='PASS' and mapping_status in {'PASS','NOT_CONFIGURED'} else 'NOT_VERIFIED','scope':scope['name'] if scope else 'UNKNOWN' if scope_error else 'Historical 298','baselineCount':298,'currentCount':len(rows),'executionNote':'Reduced active-suite ledger and mapping only; historical execution results remain preserved outside dashboard data.' if reduced_suite else 'Current core runs carry explicit scope metadata. Older raw outcomes remain historical, not current case acceptance.'},
            'acceptance':self.objects(acceptance.get('criteria',[]),'acceptance criteria'),'defects':product,'decisions':[] if reduced_suite else self.objects(readiness.get('contractDecisions',decisions),'contract decisions'),'blockers':blockers.get('caseRows',[]),'sql':sql,
            'freshness':{'status':'SOURCE_CHANGED' if mismatches else 'MATCHES_BASELINE' if manifest else 'NOT_VERIFIED','mismatches':mismatches,
                'description':'Historical Group6 source manifest compared with current source; changed tests/tools do not rewrite historical outcomes. Current runs carry separate manifests.'},
            'historicalReports':[] if reduced_suite else [self.relative(p) for p in sorted(self.reports.glob('*.md'))],'junitCI':self.junit_ci(),'warnings':self.warnings}
        if reduced_suite:
            data['runs']=[]
            data['sql'].update({'overallStatus':'PASS_FULL_ACCEPTANCE','status':'Active reduced suite contains only PASS_FULL_ACCEPTANCE cases with retained evidence. Historical SQL scope is outside this dashboard data.','gates':'HISTORICAL_GATE_EVIDENCE_RETAINED','remaining':0})
        self.collect_paths(data);return clean(data)

def evidence_response(relative,pipeline):
    p=safe_path(relative,pipeline.root)
    if relative not in pipeline.evidence:raise ValueError('Artifact not referenced by normalized dataset')
    if p.suffix.lower() in {'.png','.jpg','.jpeg','.webp'}:return p.read_bytes(),'image/'+('jpeg' if p.suffix.lower() in {'.jpg','.jpeg'} else p.suffix[1:])
    if p.suffix=='.zip':
        with zipfile.ZipFile(p) as archive:
            # No raw trace download: expose a redacted manifest, not credentials/screenshots embedded in historical archives.
            value={'artifact':relative,'archiveEntries':archive.namelist(),'policy':'Raw archive download disabled; inspect locally under existing evidence policy.'}
            return json.dumps(clean(value),ensure_ascii=False,indent=2).encode(),'text/plain; charset=utf-8'
    if p.suffix.lower() not in {'.json','.xml','.md','.txt','.log','.html','.csv'}:raise ValueError('Unsupported evidence type')
    return redact(decode(p)).encode(),'text/plain; charset=utf-8'
