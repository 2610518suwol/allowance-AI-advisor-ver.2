import {
  runIncomeExpenseTests,
  runCategoryAnalysisTests,
  runBudgetThresholdTests,
  runSavingsTests,
  runAiAnalysisTests,
  runStoragePersistenceTests,
} from '../src/utils/testRunner';

async function main() {
  console.log('=== [AI Pocket Money Management App - Automated Test Runner] ===\n');

  let totalPass = 0;
  let totalFail = 0;

  const suites = [
    { name: '1. 수입·지출 계산 테스트', fn: runIncomeExpenseTests },
    { name: '2. 카테고리 분석 테스트', fn: runCategoryAnalysisTests },
    { name: '3. 예산 테스트 (79%, 80%, 99%, 100%, 101%)', fn: runBudgetThresholdTests },
    { name: '4. 저축 테스트', fn: runSavingsTests },
    { name: '5. AI 분석 테스트', fn: runAiAnalysisTests },
    { name: '6. 데이터 저장 및 안전성 격리 테스트', fn: runStoragePersistenceTests },
  ];

  for (const s of suites) {
    console.log(`\n▶ [실행] ${s.name}`);
    const results = await s.fn();
    for (const r of results) {
      const mark = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
      if (r.status === 'PASS') totalPass++;
      else totalFail++;

      console.log(`  ${mark} | ${r.name} (${r.durationMs}ms)`);
      console.log(`     - 예상: ${r.expected}`);
      console.log(`     - 실제: ${r.actual}`);
      if (r.error) {
        console.log(`     - 에러: ${r.error}`);
        console.log(`     - 해결 가이드: ${r.troubleshooting}`);
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`테스트 실행 요약: 통과(PASS) ${totalPass}건 | 실패(FAIL) ${totalFail}건 | 총 ${totalPass + totalFail}건`);
  console.log(`======================================================`);

  if (totalFail > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
