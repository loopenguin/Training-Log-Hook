/**
 * gemini-router.js --- UserPromptSubmit Hook (L1 Universal)
 * Detects delegation-required tasks in user prompt → exit 2 (block).
 *
 * L2 CUSTOMIZATION:
 *   - 훈련일지 자동화 웹훅 도메인 패턴 추가
 */

const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  let data = {};
  try { data = JSON.parse(Buffer.concat(chunks).toString()); } catch (_) {}

  const prompt = (data.prompt || '').toLowerCase();

  const patterns = [
    // --- gemini-cli delegation ---
    { label: '웹 검색', delegate: 'gemini',
      re: /검색|찾아\s*줘|조사|트렌드|최신|뉴스|사례|레퍼런스|best\s*practice/ },
    { label: '대용량 분석', delegate: 'gemini',
      re: /전체\s*(파일|코드)\s*(읽|분석|요약)|전수\s*검사|모든\s*파일/ },
    { label: '이미지 분석', delegate: 'gemini',
      re: /이미지\s*(분석|설명|해석)|스크린샷\s*보고/ },

    // --- codex delegation ---
    { label: 'Codex 위임 (소스 코드 편집)', delegate: 'codex',
      re: /[.](js|html|css|json)\s*(수정|편집|추가|삭제|구현|패치|고쳐|바꾸)|소스\s*코드\s*(수정|편집)|함수\s*(추가|수정|구현)|버그\s*수정/ },

    // --- L2: 훈련일지 자동화 도메인 패턴 ---
    { label: '웹훅 API 조사', delegate: 'gemini',
      re: /웹\s*훅|webhook|api\s*(연동|조사|문서)|엔드포인트/ },
  ];

  const matched = patterns.find(p => p.re.test(prompt));

  if (matched) {
    if (matched.delegate === 'gemini') {
      console.log('[gemini-router] BLOCKED: ' + matched.label + ' task detected.');
      console.log('Delegate to gemini-cli: gemini -p "[task]"');
      process.exit(2);
    } else if (matched.delegate === 'codex') {
      console.log('[gemini-router] BLOCKED: ' + matched.label + ' task detected.');
      console.log('Delegate to Codex: codex "[spec]" -y');
      process.exit(2);
    }
  }

  process.exit(0);
});
