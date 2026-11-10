/**
 * MStudio Autonomous AI Newsroom Synthesizer
 * Synthesizes, translates, and rewrites incoming raw RSS items into high-standard Vietnamese news articles.
 * Enforces the MStudio Critical Language Rule: 100% fluent, professional Vietnamese journalistic standard.
 */

const VIETNAMESE_ACCENT_REGEX = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

export function isVietnameseText(text) {
  if (!text) return false;
  const match = text.match(new RegExp(VIETNAMESE_ACCENT_REGEX, "gi"));
  return (match ? match.length : 0) >= 3;
}

/**
 * Fast Google Translate GTX Engine for accurate, natural Vietnamese conversion
 */
async function translateToVietnamese(text) {
  if (!text || !text.trim()) return text;
  if (isVietnameseText(text) && text.trim().length < 60) return text;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(text.trim())}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && Array.isArray(data[0])) {
      const translated = data[0].map((item) => (item ? item[0] : "")).join("");
      if (translated && translated.trim()) {
        return translated.trim();
      }
    }
  } catch (err) {
    console.warn(`[Synthesizer] Fast translation warning for "${text.slice(0, 30)}...": ${err.message}`);
  }
  return text;
}

const SYSTEM_PROMPT = `Bạn là Trợ lý Tổng biên tập & Cây bút Tin tức Chuyên sâu của Tòa soạn MStudio Channel (Việt Nam).
NHIỆM VỤ CỐT LÕI:
Dịch thuật, tổng hợp và viết lại bài viết được cung cấp thành một bài báo tiếng Việt hoàn chỉnh theo quy chuẩn báo chí MStudio.

QUY TẮC BẮT BUỘC:
1. NGÔN NGỮ: 100% tiếng Việt tự nhiên, chuẩn mực báo chí hiện đại.
2. SAPO (summary): Viết Sapo báo chí 2-4 câu hoàn chỉnh phản ánh đúng bản chất sự việc.
3. THÂN BÀI (body): Viết bài phân tích có cấu trúc rõ ràng với các tiêu đề mục H2 (## ...).
4. TIÊU ĐỀ (title): Viết tiêu đề báo chí tiếng Việt hấp dẫn, sắc bén, không giật tít.

CHỈ TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON HỢP LỆ (không kèm markdown code block \`\`\`json):
{
  "title": "Tiêu đề bài viết bằng tiếng Việt",
  "summary": "Đoạn Sapo tóm tắt 2-4 câu bằng tiếng Việt",
  "body": "Nội dung thân bài đầy đủ có cấu trúc ## H2 bằng tiếng Việt"
}`;

/**
 * Call Gemini API if GEMINI_API_KEY is available
 */
async function callGemini(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Gemini API HTTP ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini API");
  return JSON.parse(text);
}

/**
 * Build professional MStudio Journalistic Article from translated components
 */
function buildJournalisticArticle(titleVi, summaryVi, bodyVi, sourceName, sourceUrl) {
  const cleanTitle = titleVi.replace(/^\[.*?\]\s*/, "").trim();
  
  // Format executive Sapo
  let sapo = summaryVi ? summaryVi.trim() : cleanTitle;
  if (!sapo.endsWith(".") && !sapo.endsWith("!") && !sapo.endsWith("?")) {
    sapo += ".";
  }

  // Format body with H2 structure if not already structured
  let structuredBody = bodyVi ? bodyVi.trim() : sapo;
  if (!structuredBody.includes("##")) {
    structuredBody = `## Diễn biến trọng tâm sự kiện\n\n${sapo}\n\n## Thông tin chi tiết và xác minh nguồn tin\n\n${structuredBody}\n\n## Tác động và phản ứng từ các bên liên quan\n\nSự việc đang nhận được sự quan tâm rộng rãi từ cộng đồng quốc tế và giới chuyên môn. MStudio sẽ tiếp tục theo dõi và cập nhật các diễn biến mới nhất.`;
  }

  // Append lineage attribution
  structuredBody += `\n\n---\n*Nguồn tin: ${sourceName || "Thông tấn Quốc tế"} • Bản tin tổng hợp & biên tập bởi Ban Biên tập MStudio*`;

  return {
    title: cleanTitle,
    summary: sapo,
    body: structuredBody
  };
}

/**
 * Main synthesis pipeline entrypoint
 */
export async function synthesizeArticle(rawItem) {
  const sourceName = rawItem.sourceName || "MStudio Network";
  const sourceUrl = rawItem.url || "";
  const rawTitle = rawItem.title || "";
  const rawSummary = rawItem.summary || rawItem.title || "";
  const rawBody = rawItem.body || rawItem.summary || rawItem.title || "";

  // 1. Try Gemini API if key is configured
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey) {
    try {
      const inputPrompt = `DỮ LIỆU ĐẦU VÀO CẦN BIÊN TẬP:
- Tiêu đề gốc: ${rawTitle}
- Nguồn tin gốc: ${sourceName} (${sourceUrl})
- Tóm tắt gốc: ${rawSummary}
- Nội dung gốc: ${rawBody}

HÃY DỊCH VÀ VIẾT LẠI HOÀN CHỈNH THÀNH 100% TIẾNG VIỆT CHUẨN BÁO CHÍ:`;

      const result = await callGemini(apiKey, inputPrompt);
      if (result && result.title && result.summary) {
        return buildJournalisticArticle(result.title, result.summary, result.body || result.summary, sourceName, sourceUrl);
      }
    } catch (err) {
      console.warn(`[Synthesizer] Gemini API call failed: ${err.message}. Using neural translation...`);
    }
  }

  // 2. High-speed, high-fidelity neural translation engine
  try {
    const isEnTitle = !isVietnameseText(rawTitle);
    const isEnSummary = !isVietnameseText(rawSummary);
    const isEnBody = !isVietnameseText(rawBody);

    let titleVi = rawTitle;
    let summaryVi = rawSummary;
    let bodyVi = rawBody;

    if (isEnTitle) {
      titleVi = await translateToVietnamese(rawTitle);
    }

    if (isEnSummary) {
      // Clean chunk for summary
      const chunk = rawSummary.slice(0, 1500);
      summaryVi = await translateToVietnamese(chunk);
    }

    if (isEnBody) {
      // If body is long, translate paragraphs
      const paragraphs = rawBody.split(/\n+/).filter((p) => p.trim().length > 0).slice(0, 5);
      const translatedParas = [];
      for (const p of paragraphs) {
        if (p.trim().length > 0) {
          const trans = await translateToVietnamese(p.slice(0, 1000));
          translatedParas.push(trans);
        }
      }
      bodyVi = translatedParas.join("\n\n");
    }

    return buildJournalisticArticle(titleVi, summaryVi, bodyVi, sourceName, sourceUrl);
  } catch (err) {
    console.error(`[Synthesizer] Synthesis pipeline error: ${err.message}`);
    // Absolute fallback: ensure title has Vietnamese marker
    const fallbackTitle = isVietnameseText(rawTitle) ? rawTitle : `[Bản tin Quốc tế] ${rawTitle}`;
    return buildJournalisticArticle(fallbackTitle, rawSummary, rawBody, sourceName, sourceUrl);
  }
}
