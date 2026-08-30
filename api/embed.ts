const DEFAULT_MODEL = 'liquid/lfm-2.5-embedding-350m:free';

export default async function handler(request: any, response: any) {
  const model = process.env.OPENROUTER_EMBED_MODEL || DEFAULT_MODEL;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (request.method === 'GET') {
    response.status(200).json({ configured: Boolean(apiKey), model });
    return;
  }
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    response.status(405).json({ error: '지원하지 않는 요청 방식입니다.' });
    return;
  }
  if (!apiKey) {
    response.status(503).json({ error: 'OPENROUTER_API_KEY가 설정되지 않았습니다.' });
    return;
  }

  const input = request.body?.input;
  if (!Array.isArray(input) || input.length === 0 || input.length > 64) {
    response.status(400).json({ error: 'input은 1~64개의 문자열 배열이어야 합니다.' });
    return;
  }
  if (input.some(value => typeof value !== 'string' || value.length > 1200)) {
    response.status(400).json({ error: '각 입력은 1,200자 이하의 문자열이어야 합니다.' });
    return;
  }

  try {
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://flavor-palete.vercel.app',
        'X-Title': 'Flavor Palette',
      },
      body: JSON.stringify({ model, input }),
    });
    const data = await openRouterResponse.json() as {
      data?: { embedding?: number[]; index?: number }[];
      error?: { message?: string };
    };
    if (!openRouterResponse.ok || !Array.isArray(data.data)) {
      response.status(openRouterResponse.status || 502).json({
        error: data.error?.message || 'OpenRouter 임베딩 요청에 실패했습니다.',
      });
      return;
    }
    const embeddings = [...data.data]
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      .map(item => item.embedding);
    if (embeddings.some(vector => !Array.isArray(vector))) {
      response.status(502).json({ error: '올바르지 않은 임베딩 응답입니다.' });
      return;
    }
    response.status(200).json({ model, embeddings });
  } catch {
    response.status(502).json({ error: 'OpenRouter에 연결하지 못했습니다.' });
  }
}
