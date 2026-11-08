"""Safely import a provenance-attested GitHub Actions Surefire artifact for the Dashboard."""
import argparse
import hashlib
import json
import shutil
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path, PurePosixPath

ROOT=Path(__file__).resolve().parents[2]
REPORTS=ROOT/'testing/reports'

def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def require(value,message):
    if not value:raise ValueError(message)
    return value

def suites_from_xml(raw):
    root=ET.fromstring(raw)
    suites=[root] if root.tag=='testsuite' else root.findall('./testsuite') if root.tag=='testsuites' else []
    if not suites:raise ValueError('JUnit XML has no testsuite')
    counts={'executions':0,'classes':0,'failures':0,'errors':0,'skipped':0}
    for suite in suites:
        fields={key:suite.get(key) for key in ('tests','failures','errors','skipped')}
        if not suite.get('name') or any(value is None or not value.isdigit() for value in fields.values()):raise ValueError('JUnit suite counters are invalid')
        counts['classes']+=1;counts['executions']+=int(fields['tests']);counts['failures']+=int(fields['failures']);counts['errors']+=int(fields['errors']);counts['skipped']+=int(fields['skipped'])
    return counts

def validate_metadata(metadata,run_id,zip_path):
    run=require(metadata.get('run'),'Missing run metadata');artifact=require(metadata.get('artifact'),'Missing artifact metadata');jobs=require(metadata.get('jobs'),'Missing job metadata')
    if metadata.get('source')!='GitHub Actions REST API':raise ValueError('Unattested metadata source')
    if str(run.get('id'))!=run_id or run.get('conclusion')!='success' or run.get('event') not in {'push','workflow_dispatch'}:raise ValueError('Run metadata is not a successful CI execution')
    if run.get('repository')!='MinNeoVo/ChayBook' or not run.get('head_branch') or not run.get('head_sha') or not run.get('updated_at') or not run.get('html_url'):raise ValueError('Run provenance is incomplete')
    expected=f'junit-surefire-{run_id}-backend'
    if artifact.get('name')!=expected or artifact.get('expired') is not False or artifact.get('size_in_bytes')!=zip_path.stat().st_size:raise ValueError('Artifact metadata does not match ZIP')
    completed={job.get('name'):job.get('conclusion') for job in jobs}
    if completed.get('Backend - Test')!='success' or completed.get('Frontend - Build')!='success':raise ValueError('Required CI jobs did not succeed')
    return run,artifact

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--zip',required=True,type=Path);parser.add_argument('--metadata',required=True,type=Path);parser.add_argument('--run-id',required=True);parser.add_argument('--historical-pr',default='83');args=parser.parse_args()
    source=args.zip.resolve();metadata_path=args.metadata.resolve();run_id=str(args.run_id)
    if not source.is_file() or not metadata_path.is_file() or not run_id.isdigit() or not args.historical_pr.isdigit():raise ValueError('Invalid import arguments')
    metadata=json.loads(metadata_path.read_text('utf-8'));run,artifact=validate_metadata(metadata,run_id,source)
    target=REPORTS/'evidence/ci'/f'run-{run_id}';snapshot=REPORTS/'evidence/ci/junit-ci-verified.json'
    if target.exists() or snapshot.exists():raise FileExistsError('Refusing to overwrite CI evidence or snapshot')
    with zipfile.ZipFile(source) as archive:
        members=[info for info in archive.infolist() if not info.is_dir()]
        if archive.testzip() is not None or not members or len(members)>100:raise ValueError('Invalid ZIP integrity or member count')
        total=sum(info.file_size for info in members)
        if total>32*1024*1024:raise ValueError('ZIP uncompressed payload too large')
        payload=[]
        for info in members:
            name=PurePosixPath(info.filename)
            if name.name!=info.filename or not info.filename.startswith('TEST-') or not info.filename.endswith('.xml') or '..' in name.parts or info.file_size>4*1024*1024:raise ValueError('Unsafe or unexpected ZIP member')
            raw=archive.read(info);payload.append((info.filename,raw,suites_from_xml(raw)))
    target.mkdir(parents=True)
    zip_target=target/source.name;shutil.copyfile(source,zip_target)
    aggregate={'executions':0,'classes':0,'failures':0,'errors':0,'skipped':0};artifacts=[]
    for name,raw,counts in payload:
        path=target/name;path.write_bytes(raw);relative=path.relative_to(ROOT).as_posix();artifacts.append({'path':relative,'sha256':sha256(path)})
        for key,value in counts.items():aggregate[key]+=value
    if aggregate['failures']+aggregate['errors']+aggregate['skipped']>aggregate['executions']:raise ValueError('Impossible JUnit aggregate')
    metadata_target=target/f'github-actions-run-{run_id}.json';metadata_target.write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n','utf-8')
    integrity={'schemaVersion':1,'runId':run_id,'zip':{'path':zip_target.relative_to(ROOT).as_posix(),'sha256':sha256(zip_target),'bytes':zip_target.stat().st_size},'xmlFiles':artifacts,'counts':aggregate}
    integrity_target=target/'artifact-integrity.json';integrity_target.write_text(json.dumps(integrity,ensure_ascii=False,indent=2)+'\n','utf-8')
    snapshot_data={'schemaVersion':2,'verification':{'status':'VERIFIED','repository':'MinNeoVo/ChayBook','workflow':run['name'],'runId':run_id,'commitSha':run['head_sha'],'completedAt':run['updated_at'],'sourceUrl':run['html_url'],'branch':run['head_branch'],'event':run['event']},'historicalReference':{'pullRequest':int(args.historical_pr),'relationship':'HISTORICAL_REFERENCE_ONLY'},'provenance':{'metadataPath':metadata_target.relative_to(ROOT).as_posix(),'metadataSha256':sha256(metadata_target)},'archive':integrity['zip'],'artifacts':artifacts,'expected':aggregate}
    snapshot.write_text(json.dumps(snapshot_data,ensure_ascii=False,indent=2)+'\n','utf-8')
    print(json.dumps({'snapshot':snapshot.relative_to(ROOT).as_posix(),'integrity':integrity_target.relative_to(ROOT).as_posix(),'counts':aggregate},ensure_ascii=False))

if __name__=='__main__':main()
