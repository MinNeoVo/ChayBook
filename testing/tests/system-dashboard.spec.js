import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const scope=JSON.parse(fs.readFileSync(new URL('../data/active-test-scope.json',import.meta.url),'utf8'));
const total=String(scope.caseCount);
const dashboardOrigin=`http://127.0.0.1:${process.env.CHAYBOOK_DASHBOARD_PORT || 5190}`;
test.beforeEach(async({context})=>{await context.route('**/*',r=>new URL(r.request().url()).origin===dashboardOrigin?r.continue():r.abort('blockedbyclient'));});
test('API keeps the reduced acceptance suite separate from verified CI executions',async({request})=>{
  const response=await request.get('/api/data');expect(response.status()).toBe(200);const data=await response.json();
  expect(data.cases.map(c=>c.id)).toEqual(scope.ids);expect(data.mappingValidation).toBe('PASS');
  expect(data.cases.every(c=>c.acceptanceStatus==='PASS_FULL_ACCEPTANCE')).toBe(true);
  expect(data.junitCI).toMatchObject({status:'VERIFIED',verified:true,counts:{executions:127,classes:19,passed:127,failures:0,errors:0,skipped:0},source:{runId:'42486795409',commitSha:'af18f322833039f754571c1b8b663129f4551f13',branch:'ci/upload-surefire-artifact',event:'push'}});
  expect(data.junitCI.historicalReference).toEqual({pullRequest:83,relationship:'HISTORICAL_REFERENCE_ONLY'});expect(data.junitCI.evidence).toHaveLength(22);
});
test('Dashboard keeps acceptance and JUnit CI results separate',async({page})=>{
  await page.goto('/');await expect(page.getByTestId('case-total')).toHaveText(total);
  await expect(page.getByTestId('acceptance-summary')).toHaveText(`Acceptance Cases: ${total}/${total} — Reported PASS`);
  await expect(page.getByTestId('acceptance-kpi')).toContainText(`${total}/${total}`);
  await expect(page.getByTestId('junit-kpi')).toContainText('127/127');await expect(page.getByTestId('junit-kpi')).toContainText('VERIFIED');await expect(page.getByTestId('junit-kpi')).toContainText('19 test classes');
  await expect(page.getByTestId('junit-ci-summary')).toHaveText('JUnit CI Executions: 127/127 — Verified PASS');
  await expect(page.getByRole('link',{name:'ChayBook CI run 42486795409'})).toHaveAttribute('href','https://github.com/MinNeoVo/ChayBook/actions/runs/42486795409');
  await expect(page.locator('.ci-evidence summary')).toHaveText('Evidence: 19 XML files and 3 manifests');await expect(page.locator('.ci-evidence')).not.toHaveAttribute('open','');
  await expect(page.getByText('totals are never combined.')).toBeVisible();
});
test('Dashboard does not present CI execution counts as verified without provenance',async({page})=>{
  await page.route('**/api/data',async route=>{const response=await route.fetch();const data=await response.json();data.junitCI={status:'NOT VERIFIED',verified:false,reason:'CI provenance is unavailable.',counts:null,source:null,evidence:[]};await route.fulfill({response,json:data});});
  await page.goto('/');await expect(page.getByTestId('junit-kpi')).toContainText('NOT VERIFIED');await expect(page.getByTestId('junit-kpi')).not.toContainText('127/127');await expect(page.getByTestId('junit-ci-summary')).toHaveText('JUnit CI Executions: NOT VERIFIED');
});
test('Dashboard layout uses available space at desktop, tablet and mobile widths',async({page})=>{
  for(const width of [1440,1024,768]){
    await page.setViewportSize({width,height:900});await page.goto('/');await expect(page.getByTestId('case-total')).toHaveText(total);
    const layout=await page.evaluate(()=>{const shell=document.querySelector('.shell').getBoundingClientRect();const cards=[...document.querySelectorAll('.metrics article')].map(card=>card.getBoundingClientRect());const table=document.querySelector('.table-wrap');return {documentOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,shellLeft:shell.left,shellWidth:shell.width,viewport:document.documentElement.clientWidth,cards,tableWidth:table.getBoundingClientRect().width,tableClientWidth:table.clientWidth};});
    expect(layout.documentOverflow).toBe(false);expect(layout.shellLeft).toBeGreaterThanOrEqual(0);expect(layout.shellWidth).toBeLessThanOrEqual(layout.viewport);expect(layout.cards).toHaveLength(3);for(const card of layout.cards)expect(card.width).toBeGreaterThan(150);expect(layout.tableWidth).toBeGreaterThan(0);expect(layout.tableClientWidth).toBeGreaterThan(0);
  }
});
test('Search, evidence access and path restrictions remain available',async({page,request})=>{
  await page.goto('/');const id=scope.ids[0];await page.getByLabel('Search ID, module, scenario').fill(id);
  await expect(page.getByText('1 results')).toBeVisible();await page.getByRole('button',{name:id,exact:true}).click();
  await expect(page.getByRole('dialog').locator('a').first()).toHaveAttribute('href',/^\/evidence\?path=testing%2Freports%2F/);
  for(const path of ['../Back_End/pom.xml','testing/reports/../../Back_End/pom.xml','C:/Windows/win.ini'])expect((await request.get('/evidence',{params:{path}})).status()).toBe(403);
  expect((await request.post('/api/run-sql')).status()).toBe(404);
});
test('Missing data displays an error without invented passes',async({page})=>{
  await page.route('**/api/data',r=>r.fulfill({status:503,json:{}}));await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Cannot load active test suite');await expect(page.getByTestId('case-total')).toHaveCount(0);
});
