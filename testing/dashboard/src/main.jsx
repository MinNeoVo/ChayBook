import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const Evidence = ({ paths = [] }) => <ul className="evidence">{[...new Set(paths)].map(path => <li key={path}><a href={`/evidence?path=${encodeURIComponent(path)}`} target="_blank" rel="noreferrer">Evidence: {path}</a></li>)}</ul>;

function App() {
  const [data, setData] = useState();
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState();
  useEffect(() => {
    fetch('/api/data').then(response => response.ok ? response.json() : Promise.reject(new Error('Cannot load active test suite')))
      .then(setData).catch(reason => setError(reason.message));
  }, []);
  const cases = data?.cases || [];
  const acceptancePasses = cases.filter(testcase => testcase.acceptanceStatus === 'PASS_FULL_ACCEPTANCE').length;
  const junitCI = data?.junitCI;
  const junitVerified = junitCI?.status === 'VERIFIED';
  const junitCounts = junitCI?.counts;
  const junitXmlEvidenceCount = (junitCI?.evidence || []).filter(path => path.toLowerCase().endsWith('.xml')).length;
  const junitManifestEvidenceCount = (junitCI?.evidence || []).length - junitXmlEvidenceCount;
  const visible = useMemo(() => cases.filter(testcase => `${testcase.id} ${testcase.module} ${testcase.original?.scenario || ''}`.toLowerCase().includes(query.toLowerCase())), [cases, query]);
  if (error) return <main className="shell"><p role="alert" className="error">{error}</p></main>;
  if (!data) return <main className="shell"><p role="status">Loading active test suite…</p></main>;
  return <main className="shell">
    <header className="dashboard-header"><div><p className="eyebrow">CHAYBOOK · TESTING CONTROL ROOM</p><h1>Reduced Test Suite</h1><p>{data.summary.scope}.</p><p>This narrowed scope does not represent whole-project acceptance.</p></div></header>
    <section className="panel metrics" aria-label="Testing overview">
      <article data-testid="acceptance-kpi"><small>Acceptance Cases</small><strong data-testid="case-total">{acceptancePasses}/{cases.length}</strong><p>Reported PASS · reduced active suite</p></article>
      <article className={junitVerified ? 'ci-kpi is-verified' : 'ci-kpi is-unverified'} data-testid="junit-kpi"><small>JUnit CI Executions</small>{junitVerified ? <><strong>{junitCounts.passed}/{junitCounts.executions}</strong><p><span className="status-chip">VERIFIED</span> · {junitCounts.classes} test classes</p><div className="ci-breakdown" aria-label="JUnit CI outcome breakdown"><span>Failed <b>{junitCounts.failures}</b></span><span>Errors <b>{junitCounts.errors}</b></span><span>Skipped <b>{junitCounts.skipped}</b></span></div></> : <><strong>NOT VERIFIED</strong><p>{junitCI?.reason || 'No provenance-verified GitHub Actions JUnit CI snapshot is available.'}</p></>}</article>
      <article><small>Mapping</small><strong data-testid="mapping-status">{data.mappingValidation}</strong><p>Active case IDs mapped to evidence</p></article>
    </section>
    <section className="panel" aria-label="Independent test result sources"><h2>Result sources</h2><p data-testid="acceptance-summary">Acceptance Cases: {acceptancePasses}/{cases.length} — Reported PASS</p><p className="source-separation">Acceptance cases and JUnit CI executions are independent measures; totals are never combined.</p>{junitVerified ? <><p data-testid="junit-ci-summary">JUnit CI Executions: {junitCounts.passed}/{junitCounts.executions} — Verified PASS</p><div className="ci-source-grid"><div><small>CI status</small><strong>VERIFIED</strong></div><div><small>GitHub Actions</small><a href={junitCI.source.url} target="_blank" rel="noreferrer">{junitCI.source.workflow} run {junitCI.source.runId}</a></div><div><small>Commit</small><code>{junitCI.source.commitSha}</code></div><div><small>Completed UTC</small><time dateTime={junitCI.source.completedAt}>{junitCI.source.completedAt}</time></div></div><details className="ci-evidence"><summary>Evidence: {junitXmlEvidenceCount} XML files and {junitManifestEvidenceCount} manifests</summary><Evidence paths={junitCI.evidence} /></details></> : <><p data-testid="junit-ci-summary">JUnit CI Executions: NOT VERIFIED</p><p>{junitCI?.reason || 'No provenance-verified GitHub Actions JUnit CI snapshot is available.'}</p></>}</section>
    <section className="panel case-panel"><h2>Active evidence-backed cases</h2><label>Search ID, module, scenario<input value={query} onChange={event => setQuery(event.target.value)} /></label><p>{visible.length} results</p><div className="table-wrap"><table className="case-table"><thead><tr><th>ID</th><th>Module</th><th>Priority</th><th>Acceptance</th></tr></thead><tbody>{visible.map(testcase => <tr key={testcase.id}><td><button className="link" onClick={() => setSelected(testcase)}>{testcase.id}</button></td><td>{testcase.module}</td><td>{testcase.priority}</td><td>{testcase.acceptanceStatus}</td></tr>)}</tbody></table></div></section>
    <section className="panel"><h2>Scope record</h2><p>{data.summary.executionNote}</p><p>{data.freshness?.description}</p></section>
    {selected && <section className="panel" role="dialog" aria-label={`${selected.id} evidence`}><button onClick={() => setSelected(undefined)}>Close</button><h2>{selected.id}</h2><p>{selected.original?.scenario}</p><p>{selected.actualResult}</p><h3>Evidence</h3><Evidence paths={selected.evidence} /></section>}
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
