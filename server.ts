import express, { Request, Response } from 'express';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini API client if API key is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('[Server] Gemini API Client initialized successfully with model gemini-3.8-flash');
  } catch (err) {
    console.error('[Server] Failed to initialize GoogleGenAI client:', err);
  }
} else {
  console.log('[Server] No GEMINI_API_KEY detected in environment. Rule-based analysis engine will be used.');
}

// In-memory data store for server-side persistence backup
let serverStateStore: any = null;

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Server-side Developer Auth Verification
app.post('/api/dev/verify-auth', (req: Request, res: Response) => {
  // Check authorization token or allow in development environment
  const authHeader = req.headers.authorization;
  const devPass = req.body?.secretCode;

  // In development, default to authorized; if secret code is provided, check against DEV_PASS or default "dev1234"
  const isDevEnv = process.env.NODE_ENV !== 'production';
  const isValidPass = devPass === 'dev1234' || devPass === process.env.DEV_SECRET || isDevEnv;

  if (isValidPass) {
    res.json({ authorized: true, message: '개발자 권한이 서버에서 인증되었습니다.' });
  } else {
    res.status(403).json({ authorized: false, error: '개발자 인증 실패: 허가되지 않은 접근입니다.' });
  }
});

// Sync endpoint for optional server persistence
app.post('/api/ledger/sync', (req: Request, res: Response) => {
  try {
    serverStateStore = req.body;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ledger/sync', (req: Request, res: Response) => {
  res.json({ data: serverStateStore });
});

// Helper for Rule-Based AI Coach Fallback
function generateServerRuleBasedAnalysis(transactions: any[], monthStr: string, budget?: any) {
  const monthTxs = transactions.filter((t: any) => t.date && t.date.startsWith(monthStr));
  const expenses = monthTxs.filter((t: any) => t.type === 'expense');
  const totalExpense = expenses.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

  // Category breakdown
  const catMap: Record<string, number> = {};
  for (const t of expenses) {
    const c = t.category || '기타';
    catMap[c] = (catMap[c] || 0) + (Number(t.amount) || 0);
  }

  const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const topCatName = sortedCats.length > 0 ? sortedCats[0][0] : '없음';
  const topCatAmt = sortedCats.length > 0 ? sortedCats[0][1] : 0;
  const topCatPct = totalExpense > 0 ? Math.round((topCatAmt / totalExpense) * 100) : 0;

  // Needs vs Wants
  let needsTotal = 0;
  let wantsTotal = 0;
  for (const t of expenses) {
    const amt = Number(t.amount) || 0;
    if (t.nature === '필요') needsTotal += amt;
    else wantsTotal += amt;
  }
  const needsRatio = totalExpense > 0 ? Math.round((needsTotal / totalExpense) * 100) : 0;
  const wantsRatio = totalExpense > 0 ? Math.round((wantsTotal / totalExpense) * 100) : 0;

  const discoveredHabits = [];
  const actionSteps = [];
  let projectedSavings = 0;

  // Specific game item check as prompted
  const gameAmt = catMap['게임 아이템'] || 0;
  if (gameAmt >= 20000) {
    const saveAmt = Math.round(gameAmt * 0.33);
    projectedSavings += saveAmt;
    discoveredHabits.push({
      title: '게임 아이템 지출 비중이 높아요',
      description: `이번 달 게임 아이템에 ₩${gameAmt.toLocaleString()}원을 사용했어요.`,
      severity: 'warning',
      category: '게임 아이템',
    });
    actionSteps.push(
      `이번 달 게임 아이템에 ₩${gameAmt.toLocaleString()}원을 사용했어요. 다음 달에는 게임 예산을 ₩${(gameAmt - saveAmt).toLocaleString()}원으로 설정하면 최대 ₩${saveAmt.toLocaleString()}원을 더 아낄 수 있어요.`
    );
  }

  const snackAmt = (catMap['편의점 및 간식'] || 0);
  if (snackAmt >= 15000) {
    const saveAmt = Math.round(snackAmt * 0.3);
    projectedSavings += saveAmt;
    discoveredHabits.push({
      title: '편의점 및 간식 반복 지출',
      description: `편의점과 간식에 총 ₩${snackAmt.toLocaleString()}원이 쓰였습니다.`,
      severity: 'warning',
      category: '편의점 및 간식',
    });
    actionSteps.push('하교 후 무심코 편의점에 들르는 횟수를 주 2회 이하로 정해보세요.');
  }

  if (wantsRatio >= 60) {
    discoveredHabits.push({
      title: '선택 지출(하고 싶은 것) 위주의 소비 습관',
      description: `전체 소비 중 선택 지출이 ${wantsRatio}%를 차지하고 있습니다.`,
      severity: 'alert',
    });
    actionSteps.push('물건을 결제하기 전 10분만 멈추고 정말 필요한지 생각하는 쿨링오프 타임을 가져보세요.');
  }

  if (discoveredHabits.length === 0) {
    discoveredHabits.push({
      title: '계획적이고 건전한 용돈 소비 패턴',
      description: '불필요한 과소비 없이 균형 잡힌 용돈 관리를 실천하고 있습니다.',
      severity: 'info',
    });
    actionSteps.push('현재의 알뜰한 지출 루틴을 지키면서 남은 잔액을 저축 목표에 넣어보세요.');
    projectedSavings = Math.round(totalExpense * 0.1);
  }

  return {
    discoveredHabits,
    dataGroundedAnalysis: `이번 달 총 지출은 ₩${totalExpense.toLocaleString()}원이며, 가장 큰 비중은 [${topCatName}]으로 ₩${topCatAmt.toLocaleString()}원(${topCatPct}%)입니다. (필요 지출: ${needsRatio}%, 선택 지출: ${wantsRatio}%)`,
    needForImprovement: '충동적인 선택 지출을 줄이고 목표 저축액을 꾸준히 확보하기 위해 카테고리별 상한선 설정이 유익합니다.',
    concreteActionSteps: actionSteps,
    projectedMonthlySavings: projectedSavings,
    cheeringMessage: `작은 지출을 조금씩 아끼면 다음 달 약 ₩${projectedSavings.toLocaleString()}원을 더 모을 수 있어요! 차근차근 실천해 봐요!`,
    topSpendingCategory: topCatName,
    needsRatio,
    wantsRatio,
    source: 'rule_based',
    generatedAt: new Date().toISOString(),
  };
}

// AI Coach Analysis Endpoint
app.post('/api/ai/coach', async (req: Request, res: Response) => {
  const { transactions = [], monthStr = '2026-10', budget } = req.body;

  // Fallback if no Gemini client
  if (!ai || !process.env.GEMINI_API_KEY) {
    const fallback = generateServerRuleBasedAnalysis(transactions, monthStr, budget);
    return res.json(fallback);
  }

  try {
    const monthTxs = transactions.filter((t: any) => t.date && t.date.startsWith(monthStr));
    const txSummaryJson = JSON.stringify(monthTxs.slice(0, 35));

    const prompt = `
당신은 대한민국 학생들을 위한 따뜻하고 전문적인 "AI 용돈 관리 코치"입니다.
다음 학생의 이번 달(${monthStr}) 실제 소비 데이터를 엄밀히 분석하여 학생 눈높이에 맞춘 구체적인 조언을 제공하세요.
절대로 지출이 많다는 이유만으로 무조건 낭비라고 비난하지 말고, 예산과 지출 목적(필요 지출 vs 선택 지출)을 고려하세요.
예를 들어 게임 아이템에 30,000원을 사용했다면 "이번 달 게임 아이템에 30,000원을 사용했어요. 다음 달에는 게임 예산을 20,000원으로 설정하면 최대 10,000원을 더 아낄 수 있어요." 와 같은 구체적 실천 방법과 절약 가능 금액을 제시하세요.

[학생 소비 데이터]
${txSummaryJson}

[월 예산 정보]
${JSON.stringify(budget || {})}

반드시 아래 JSON 스키마 규격으로만 응답하세요.
`;

    const geminiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            discoveredHabits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  severity: { type: Type.STRING, description: "'info' | 'warning' | 'alert'" },
                  category: { type: Type.STRING },
                },
                required: ['title', 'description', 'severity'],
              },
            },
            dataGroundedAnalysis: { type: Type.STRING },
            needForImprovement: { type: Type.STRING },
            concreteActionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            projectedMonthlySavings: { type: Type.NUMBER },
            cheeringMessage: { type: Type.STRING },
            topSpendingCategory: { type: Type.STRING },
            needsRatio: { type: Type.NUMBER },
            wantsRatio: { type: Type.NUMBER },
          },
          required: [
            'discoveredHabits',
            'dataGroundedAnalysis',
            'needForImprovement',
            'concreteActionSteps',
            'projectedMonthlySavings',
            'cheeringMessage',
          ],
        },
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API request timeout (25s)')), 25000)
    );

    const response = await Promise.race([geminiCall, timeoutPromise]);

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned empty response');
    }

    const parsed = JSON.parse(text);
    return res.json({
      ...parsed,
      source: 'gemini',
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.log('[Server] Note: Gemini API responded or timed out, serving fast rule-based analysis smoothly:', err.message);
    const fallback = generateServerRuleBasedAnalysis(transactions, monthStr, budget);
    return res.json(fallback);
  }
});

// AI Chatbot Endpoint
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const { message = '', transactions = [], monthStr = '2026-10', budget } = req.body;

  // Compute actual metrics to ground the chatbot
  const monthTxs = transactions.filter((t: any) => t.date && t.date.startsWith(monthStr));
  const expenses = monthTxs.filter((t: any) => t.type === 'expense');
  const totalExpense = expenses.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
  const totalIncome = monthTxs.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

  const catMap: Record<string, number> = {};
  for (const t of expenses) {
    const c = t.category || '기타';
    catMap[c] = (catMap[c] || 0) + (Number(t.amount) || 0);
  }
  const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const topCat = sortedCats[0] || ['없음', 0];

  // Specific rule-based responses for common student questions if Gemini not active
  const lowerMsg = message.toLowerCase();

  let ruleResponse = '';
  if (lowerMsg.includes('가장 많이 쓴 곳') || lowerMsg.includes('가장 많이') || lowerMsg.includes('어디에 썼')) {
    ruleResponse = `이번 달(${monthStr})에 돈을 가장 많이 쓴 카테고리는 [${topCat[0]}]이며 총 ₩${topCat[1].toLocaleString()}원을 지출했어요! (이번 달 총지출 ₩${totalExpense.toLocaleString()}원의 약 ${totalExpense > 0 ? Math.round((topCat[1] / totalExpense) * 100) : 0}%에 해당해요.)`;
  } else if (lowerMsg.includes('게임') || lowerMsg.includes('아이템')) {
    const gameAmt = catMap['게임 아이템'] || 0;
    ruleResponse = `이번 달 게임 아이템 지출은 ₩${gameAmt.toLocaleString()}원이에요. 게임 지출을 줄이려면:\n1. '월간 게임 한도 ₩20,000원'과 같이 미리 금액을 정해두기\n2. 충동적으로 뽑기를 누르기 전 24시간 장바구니에 담아두는 '24시간 쿨다운' 실천하기\n3. 시즌 패스 중복 결제 피하기를 실천해 보세요!`;
  } else if (lowerMsg.includes('예산') || lowerMsg.includes('추천')) {
    const recTotal = Math.round(totalExpense * 0.9 / 1000) * 1000 || 45000;
    ruleResponse = `지난 소비 데이터를 바탕으로 다음 달 총 예산으로 ₩${recTotal.toLocaleString()}원을 추천해요!\n- 편의점/간식: ₩${Math.round(recTotal * 0.3 / 1000) * 1000}원\n- 교통비: ₩${Math.round(recTotal * 0.2 / 1000) * 1000}원\n- 학용품: ₩${Math.round(recTotal * 0.2 / 1000) * 1000}원\n- 여가 및 기타: ₩${Math.round(recTotal * 0.3 / 1000) * 1000}원\n불필요한 간식 지출을 10%만 아껴도 목표 달성에 충분합니다!`;
  } else if (lowerMsg.includes('저축') || lowerMsg.includes('사려면') || lowerMsg.includes('50,000') || lowerMsg.includes('5만')) {
    ruleResponse = `₩50,000원짜리 물건을 사려면:\n- 한 달(4주) 동안 매주 ₩12,500원씩 모으거나\n- 매일 간식비 ₩1,700원(초코우유 1개 값)을 30일간 저금통에 넣으면 한 달 안에 살 수 있어요! '저축 목표' 탭에서 새 목표로 등록해 보세요!`;
  }

  // If Gemini client available, prompt Gemini for a grounded conversational answer
  if (ai && process.env.GEMINI_API_KEY) {
    try {
      const geminiChatCall = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `당신은 학생들을 위한 친절한 AI 용돈 상담 멘토입니다.
다음 학생의 실제 가계부 데이터를 정확히 참고하여 질문에 한국어로 다정하고 현실적으로 답변하세요.
절대로 훈계하거나 비난하지 말고, 숫자에 근거하여 공감하면서 실천 가능한 팁을 알려주세요.

[학생의 이번 달 실제 데이터]
- 총수입: ₩${totalIncome.toLocaleString()}원
- 총지출: ₩${totalExpense.toLocaleString()}원
- 최다 지출 카테고리: ${topCat[0]} (₩${topCat[1].toLocaleString()}원)
- 카테고리별 지출: ${JSON.stringify(catMap)}

학생 질문: "${message}"`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini Chat request timeout (20s)')), 20000)
      );

      const response = await Promise.race([geminiChatCall, timeoutPromise]);
      const replyText = response.text || ruleResponse || '질문해 주셔서 고마워요! 용돈을 더 알뜰하게 관리할 수 있도록 언제든 도와줄게요.';
      return res.json({ reply: replyText, source: 'gemini' });
    } catch (err: any) {
      console.log('[Server] Note: Gemini Chat returned or timed out, serving fast rule response smoothly:', err.message);
    }
  }

  // Rule-based fallback
  const finalReply = ruleResponse || `이번 달 총 지출은 ₩${totalExpense.toLocaleString()}원이고 [${topCat[0]}]에 가장 많은 금액을 사용했어요. 목표 저축액을 정하고 매주 조금씩 모아보는 건 어떨까요? 언제든 더 궁금한 점을 물어보세요!`;
  return res.json({ reply: finalReply, source: 'rule_based' });
});

// Configure Vite middleware in development or serve static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Server] Pocket Money AI App running at http://localhost:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
