/* =========================================================================
   EduPulse AI - Shared Utilities & AI Engine (shared.js)
   Used across all portals: Gemini LLM integration, Modals, Toasts, AI Chat,
   Smart Search, Feedback, and Navigation controls
   ========================================================================= */

/* --- Toast Notifications --- */
function showToast(title, message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const borderColor = type === 'success' ? 'border-emerald-500' : type === 'warning' ? 'border-amber-500' : 'border-indigo-500';
  const iconSvg = type === 'success' 
    ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>' 
    : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>';

  toast.className = `p-3.5 bg-white rounded-2xl shadow-xl border-l-4 ${borderColor} border border-slate-200 flex items-start gap-3 w-80 text-xs transition-all duration-300 pointer-events-auto transform translate-y-2 opacity-0`;
  toast.innerHTML = `
    <div class="text-indigo-600 flex-shrink-0 mt-0.5">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">${iconSvg}</svg>
    </div>
    <div class="flex-1">
      <div class="font-bold text-slate-800">${escapeHtml(title)}</div>
      <div class="text-slate-500 text-[11px] mt-0.5 leading-snug">${escapeHtml(message)}</div>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 20);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

/* --- Modals --- */
function toggleModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.toggle('hidden');
}

function openAiResultModal(title, text) {
  const existing = document.getElementById('dynamicAiModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'dynamicAiModal';
  modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white w-full max-w-xl max-h-[85vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in">
      <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
        <h3 class="text-sm font-bold">${escapeHtml(title)}</h3>
        <button onclick="document.getElementById('dynamicAiModal').remove()" class="text-slate-400 hover:text-white text-base">✕</button>
      </div>
      <div class="p-5 overflow-y-auto text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
        ${formatMarkdownSimple(text)}
      </div>
      <div class="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
        <button onclick="document.getElementById('dynamicAiModal').remove()" class="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition">Got it</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

/* --- String Utilities --- */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMarkdownSimple(text) {
  if (!text) return '';

  let res = escapeHtml(String(text));

  // Fenced code blocks
  res = res.replace(/```([\s\S]*?)```/g, '<pre class="my-2 p-3 rounded-xl bg-slate-900 text-slate-100 overflow-x-auto text-[11px] leading-relaxed"><code>$1</code></pre>');
  // Inline code
  res = res.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700">$1</code>');
  // Headings
  res = res.replace(/^### (.*$)/gim, '<h4 class="font-bold text-slate-900 text-sm mt-3 mb-1">$1</h4>');
  res = res.replace(/^## (.*$)/gim, '<h3 class="font-bold text-slate-900 text-base mt-3 mb-1">$1</h3>');
  res = res.replace(/^# (.*$)/gim, '<h2 class="font-bold text-slate-900 text-lg mt-3 mb-1">$1</h2>');
  // Bold / italic
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  res = res.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Bullets and numbered steps
  res = res.replace(/^\s*[•\-]\s+(.*)$/gim, '<li class="ml-5 list-disc mb-0.5">$1</li>');
  res = res.replace(/^\s*(\d+)\.\s+(.*)$/gim, '<li class="ml-5 list-decimal mb-0.5">$2</li>');
  // Simple horizontal divider
  res = res.replace(/^\s*---+\s*$/gim, '<hr class="my-2 border-slate-200">');

  return res;
}

/* --- Gemini LLM API Integration --- */
async function callGeminiLlm(systemPrompt, userQuery, isJson = false) {
  const apiKey = (AppState.apiKey || '').trim();

  // Never waste 4–5 seconds retrying an API request when no key was configured.
  // The application has a high-quality local tutor fallback for demo/offline use.
  if (!apiKey) return null;

  const model = 'gemini-3-flash-preview';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.35,
      topP: 0.9,
      maxOutputTokens: 1200
    }
  };

  if (isJson) {
    payload.generationConfig.responseMimeType = 'application/json';
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.warn('Gemini API request failed:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    return result?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim() || null;
  } catch (err) {
    console.warn('Gemini API unavailable; using local tutor fallback:', err);
    return null;
  }
}

/* --- AI Academic Tutor Chat --- */
function configureGeminiKey() {
  const current = (AppState.apiKey || '').trim();
  const key = window.prompt(
    'Enter your Gemini API key for live AI responses. For a public deployment, use a backend instead of exposing an API key in browser code.',
    current
  );

  if (key === null) return;
  AppState.apiKey = key.trim();
  saveAppState();

  if (AppState.apiKey) {
    showToast('Gemini Connected', 'Live AI responses are enabled for this browser.', 'success');
  } else {
    showToast('Local Tutor Mode', 'Using the built-in academic tutor without an API key.', 'info');
  }
}

function buildStudentAiContext() {
  if (typeof AppState === 'undefined') return '';

  const logs = Array.isArray(AppState.studentDiaryLogs) ? AppState.studentDiaryLogs.slice(0, 3) : [];
  if (!logs.length) return 'No study diary entries are available yet.';

  return logs.map((log, i) =>
    `${i + 1}. ${log.subject} — ${log.topic} — ${log.minutes} min. Notes: ${log.notes || 'No notes'}`
  ).join('\n');
}

function getLocalTutorResponse(query) {
  const q = String(query || '').trim();
  const lower = q.toLowerCase();

  const context = buildStudentAiContext();
  let answer = '';

  if (/\b(hello|hi|hey|good morning|good afternoon|good evening)\b/.test(lower)) {
    answer = `### Hello! 👋

I'm your **EduPulse AI study tutor**. I can help you understand concepts, solve problems, prepare for exams, create quizzes, and identify what you should revise next.

**Try asking:**
- Explain Newton's laws with a real-life example.
- Solve this integral step-by-step.
- Give me 5 MCQs on electromagnetic induction.
- What should I revise from my latest diary entry?`;
  } else if (lower.includes('lenz') || lower.includes('faraday') || lower.includes('electromagnetic induction')) {
    answer = `### Electromagnetic Induction — Simple Explanation

**1. Faraday's Law**
When magnetic flux through a coil changes, an EMF is induced:

**EMF = −N(dΦ/dt)**

- **N** = number of turns
- **Φ** = magnetic flux
- The faster the flux changes, the larger the induced EMF.

**2. Why is there a negative sign?**
The negative sign represents **Lenz's Law**: the induced current produces a magnetic effect that **opposes the change in flux**.

**3. Easy example**
Bring a North-pole magnet toward a conducting loop. The loop behaves like a North pole on the approaching side, so it **repels** the magnet.

**4. Exam tip**
Remember: **Faraday tells you the magnitude; Lenz tells you the direction.**

If you want, send me a numerical problem and I'll solve it step-by-step.`;
  } else if (lower.includes('newton') || lower.includes('force') || lower.includes('motion')) {
    answer = `### Newton's Laws of Motion

**1. First Law — Inertia**
An object remains at rest or moves with constant velocity unless an external unbalanced force acts on it.

**2. Second Law**
**F = ma**

A larger force produces a larger acceleration, while a larger mass produces a smaller acceleration for the same force.

**3. Third Law**
For every action, there is an equal and opposite reaction.

**Real-life example:** When you push the ground backward while walking, the ground pushes you forward.

**Quick check:** If a 2 kg object experiences a 10 N net force, its acceleration is **5 m/s²** because \`a = F/m = 10/2\`.`;
  } else if (lower.includes('integration by parts') || lower.includes('integral') || lower.includes('calculus')) {
    answer = `### Integration by Parts

The formula is:

**∫u dv = uv − ∫v du**

**Derivation**
1. Start with the product rule: \`d(uv) = u dv + v du\`.
2. Rearrange: \`u dv = d(uv) − v du\`.
3. Integrate both sides: **∫u dv = uv − ∫v du**.

**Choosing u — LIATE**
- **L** — Logarithmic
- **I** — Inverse trigonometric
- **A** — Algebraic
- **T** — Trigonometric
- **E** — Exponential

Send me an integral such as \`∫ x e^x dx\` and I'll show every step.`;
  } else if (lower.includes('quiz') || lower.includes('mcq') || lower.includes('practice questions')) {
    const topic = q.replace(/(give me|generate|create|make|a|an|some|quiz|mcqs?|practice questions?)/gi, ' ').replace(/\s+/g, ' ').trim() || 'Physics';
    answer = `### Quick Practice Quiz — ${escapeHtml(topic)}

**Q1.** What is the best way to learn a difficult concept?
A) Memorize without understanding  
B) Understand the principle, then practise  
C) Skip examples  
D) Only read the definition

**Q2.** What should you do after getting a practice question wrong?
A) Ignore it  
B) Memorize the answer  
C) Find the misconception and retry  
D) Stop practising

**Q3.** Which approach is best for exam preparation?
A) One long session before the exam  
B) Regular practice + revision of weak topics  
C) Only watching videos  
D) Only reading notes

Reply with your answers like **1-B, 2-C, 3-B**, and I'll evaluate them.`;
  } else if (lower.includes('diary') || lower.includes('latest entry') || lower.includes('what should i revise')) {
    const latest = (Array.isArray(AppState?.studentDiaryLogs) && AppState.studentDiaryLogs[0]) || null;
    if (latest) {
      answer = `### Based on Your Learning Diary

Your latest entry is **${escapeHtml(latest.subject)} — ${escapeHtml(latest.topic)}** (${latest.minutes} minutes).

**What you understood:** ${escapeHtml(latest.notes || 'No summary provided.')}

**Recommended next steps**
1. Review the core definition/formula once.
2. Solve 3–5 problems without looking at the solution.
3. Write one sentence explaining the concept in your own words.
4. Take a short diagnostic quiz.

${latest.teacherFeedback ? `**Teacher feedback:** ${escapeHtml(latest.teacherFeedback)}` : '**Teacher feedback:** No feedback has been added to this entry yet.'}`;
    } else {
      answer = `### Let's Build Your Study Plan

You don't have a diary entry yet. Add today's **subject, topic, time spent, and study summary** first.

Then I can use your diary to recommend exactly what to revise next.`;
    }
  } else if (lower.includes('python') || lower.includes('java') || lower.includes('code') || lower.includes('program')) {
    answer = `### Let's Solve It Step-by-Step

I can help you with programming too.

Please send:
1. **The problem statement**
2. **Your code** (if you have written it)
3. **The error/output** you are getting

I'll explain the mistake first, then give the corrected code and a simple explanation of why it works.

Your current study context:
${escapeHtml(context)}`;
  } else {
    answer = `### Let's Understand This Together

I can help you with **concepts, formulas, coding, problems, quizzes, and exam preparation**.

For the best answer, tell me the **topic + what you are confused about**.

For example:
> "Explain PCA like I'm a beginner."
> "Solve this SQL query step-by-step."
> "Explain CNN with a simple example."
> "Give me 5 questions on Lenz's Law."

**Your recent study context**
${escapeHtml(context)}

If you paste the exact question, I'll work through it with you step-by-step.`;
  }

  return answer;
}

async function handleSendAiMessage(e) {
  if (e) e.preventDefault();

  const input = document.getElementById('aiChatInput');
  if (!input) return;

  const query = input.value.trim();
  if (!query) return;

  input.value = '';
  appendChatMessage('user', query);

  const thinkingBubbleId = appendThinkingMessage();

  // Keep the model grounded in the student's actual learning activity.
  const studentContext = buildStudentAiContext();
  const recentChat = Array.isArray(AppState.chatHistory)
    ? AppState.chatHistory.slice(-6).map(m => `${m.role}: ${m.text}`).join('\n')
    : '';

  const systemPrompt = `You are EduPulse AI, a friendly expert academic tutor.
Explain like a patient teacher, not like a search engine.
Give direct answers first, then step-by-step reasoning, examples, and a short exam tip when useful.
Adapt to the student's level and never invent facts.
Use the student's diary context when it is relevant.
If the user asks for code, explain the bug and provide working code.
Student diary:
${studentContext}

Recent conversation:
${recentChat}`;

  const aiText = await callGeminiLlm(systemPrompt, query);
  removeThinkingMessage(thinkingBubbleId);

  const response = aiText || getLocalTutorResponse(query);
  appendChatMessage('ai', response);

  if (!Array.isArray(AppState.chatHistory)) AppState.chatHistory = [];
  AppState.chatHistory.push({ role: 'user', text: query, time: Date.now() });
  AppState.chatHistory.push({ role: 'assistant', text: response, time: Date.now() });
  AppState.chatHistory = AppState.chatHistory.slice(-20);
  saveAppState();
}

function sendQuickPrompt(promptText) {
  const input = document.getElementById('aiChatInput');
  if (input) {
    input.value = promptText;
    handleSendAiMessage();
  }
}

function appendChatMessage(sender, text) {
  const stream = document.getElementById('aiChatConversationStream');
  if (!stream) return;
  const isUser = sender === 'user';
  
  const bubble = document.createElement('div');
  bubble.className = `flex items-start gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`;
  bubble.innerHTML = `
    <div class="w-8 h-8 rounded-xl ${isUser ? 'bg-indigo-600' : 'bg-brand-600'} text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
      ${isUser ? 'ME' : 'AI'}
    </div>
    <div class="${isUser ? 'bg-brand-600 text-white' : 'bg-white text-slate-700'} p-4 rounded-2xl ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'} border ${isUser ? 'border-brand-500' : 'border-slate-200'} shadow-xs text-xs leading-relaxed space-y-1.5 whitespace-pre-wrap">
      ${formatMarkdownSimple(text)}
    </div>
  `;
  stream.appendChild(bubble);
  stream.scrollTop = stream.scrollHeight;
}

function appendThinkingMessage() {
  const stream = document.getElementById('aiChatConversationStream');
  if (!stream) return null;
  const id = 'thinking-' + Date.now();
  const bubble = document.createElement('div');
  bubble.id = id;
  bubble.className = 'flex items-start gap-3 max-w-2xl';
  bubble.innerHTML = `
    <div class="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">AI</div>
    <div class="bg-white text-slate-500 p-3.5 rounded-2xl rounded-tl-none border border-slate-200 text-xs flex items-center gap-2 shadow-xs">
      <div class="flex space-x-1">
        <div class="w-1.5 h-1.5 bg-brand-600 rounded-full animate-bounce"></div>
        <div class="w-1.5 h-1.5 bg-brand-600 rounded-full animate-bounce" style="animation-delay: 0.15s"></div>
        <div class="w-1.5 h-1.5 bg-brand-600 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
      </div>
      <span>Thinking, organizing pedagogical steps...</span>
    </div>
  `;
  stream.appendChild(bubble);
  stream.scrollTop = stream.scrollHeight;
  return id;
}

function removeThinkingMessage(id) {
  if (!id) return;
  const el = document.getElementById(id);
  if (el) el.remove();
}

function clearChatHistory() {
  const stream = document.getElementById('aiChatConversationStream');
  if (!stream) return;
  stream.innerHTML = `
    <div class="flex items-start gap-3 max-w-2xl">
      <div class="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">AI</div>
      <div class="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-xs text-xs text-slate-700 leading-relaxed space-y-2">
        <p class="font-semibold text-slate-900">Conversation reset. How can I assist your study session today?</p>
      </div>
    </div>
  `;
  showToast('Chat Cleared', 'Chat history refreshed.');
}

/* --- Smart AI Search ---
   Hybrid search engine:
   1) Uses Gemini when a key is configured.
   2) Always works without a key using the built-in tutor.
   3) Optionally enriches the answer with live Wikipedia search results.
*/
async function fetchAcademicWebResults(query) {
  try {
    const url = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' +
      encodeURIComponent(query) + '&format=json&origin=*&utf8=1&srlimit=5';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const hits = Array.isArray(data?.query?.search) ? data.query.search : [];
    return hits.map(item => ({
      title: item.title,
      snippet: String(item.snippet || '').replace(/<[^>]*>/g, ''),
      url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(String(item.title).replace(/ /g, '_'))
    }));
  } catch (err) {
    console.warn('Academic web search unavailable:', err);
    return [];
  }
}

function buildSmartSearchFallback(query, webResults) {
  const base = getLocalTutorResponse(query);
  const links = (webResults || []).slice(0, 3);
  let text = base;

  if (links.length) {
    text += `\n\n### Further Reading\n` + links.map((r, i) =>
      `${i + 1}. **${r.title}** — ${r.snippet}`
    ).join('\n');
  } else {
    text += `\n\n### Search Tip\nNo live academic source was reachable right now. You can still use the explanation above, or connect Gemini for full generative answers.`;
  }
  return text;
}

async function executeSmartSearch(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('smartSearchQueryInput');
  const container = document.getElementById('smartSearchResultsContainer');
  if (!input || !container) return;

  const query = input.value.trim();
  if (!query) {
    input.focus();
    showToast('Search Required', 'Enter a topic, question, formula, or concept.', 'warning');
    return;
  }

  container.innerHTML = `
    <div class="p-6 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
      <div class="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      <div class="font-semibold text-slate-700">Thinking like an academic tutor...</div>
      <div class="mt-1">Understanding your question and finding useful study resources.</div>
    </div>`;

  const studentContext = buildStudentAiContext();
  const systemPrompt = `You are EduPulse AI, a high-quality academic search and tutoring assistant.
Answer the student's exact question directly. Do not behave like a generic search engine.
Explain at the student's level using headings, steps, examples, formulas where appropriate, common mistakes, and an exam tip.
If the query is ambiguous, state the most likely interpretation and answer it instead of refusing.
If the user asks for code, give working code and explain it.
Use the student's recent study diary when it helps personalize the answer.
Student context:\n${studentContext}`;

  // Run live source lookup in parallel with Gemini so search remains useful without an API key.
  const [aiSummary, webResults] = await Promise.all([
    callGeminiLlm(systemPrompt, query),
    fetchAcademicWebResults(query)
  ]);

  const responseText = aiSummary || buildSmartSearchFallback(query, webResults);
  const sourceHtml = webResults.length ? `
    <div class="space-y-2">
      <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Academic Sources</h4>
      ${webResults.slice(0, 4).map(r => `
        <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer"
           class="block p-3 bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition">
          <div class="text-xs font-bold text-slate-800">${escapeHtml(r.title)}</div>
          <div class="text-[11px] text-slate-500 mt-1 line-clamp-2">${escapeHtml(r.snippet)}</div>
          <div class="text-[10px] text-brand-600 font-semibold mt-1">Open source ↗</div>
        </a>`).join('')}
    </div>` : `
    <div class="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-800">
      Live sources were unavailable. The answer above was generated from EduPulse's built-in academic tutor.
    </div>`;

  container.innerHTML = `
    <div class="p-5 bg-gradient-to-br from-indigo-50/90 to-purple-50/50 rounded-2xl border border-indigo-200/80 shadow-xs space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-100/70 px-2 py-1 rounded-md flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          ${aiSummary ? 'AI Academic Answer' : 'EduPulse Tutor Answer'}
        </span>
        <span class="text-[10px] text-slate-400 font-mono">Personalized to your study context</span>
      </div>
      <div class="text-xs text-slate-800 leading-relaxed">
        ${formatMarkdownSimple(responseText)}
      </div>
    </div>

    ${sourceHtml}

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button type="button" onclick="sendQuickPrompt(${JSON.stringify('Explain ' + query + ' in simple terms with an example.')})"
        class="p-3 bg-white rounded-xl border border-slate-200 text-left hover:border-brand-300 transition">
        <div class="text-xs font-bold text-slate-800">Explain simply</div>
        <div class="text-[10px] text-slate-500 mt-1">Get a beginner-friendly explanation.</div>
      </button>
      <button type="button" onclick="sendQuickPrompt(${JSON.stringify('Give me 5 practice questions on ' + query + ' with answers.')})"
        class="p-3 bg-white rounded-xl border border-slate-200 text-left hover:border-brand-300 transition">
        <div class="text-xs font-bold text-slate-800">Practice this topic</div>
        <div class="text-[10px] text-slate-500 mt-1">Generate questions and check your understanding.</div>
      </button>
    </div>
  `;

  // Keep search activity in the same conversational memory as the tutor.
  if (!Array.isArray(AppState.chatHistory)) AppState.chatHistory = [];
  AppState.chatHistory.push({ role: 'user', text: '[Smart Search] ' + query, time: Date.now() });
  AppState.chatHistory.push({ role: 'assistant', text: responseText, time: Date.now() });
  AppState.chatHistory = AppState.chatHistory.slice(-20);
  saveAppState();
}

function openStudyResource(title) {
  openAiResultModal(title, `### ${title}\n\n**Curriculum Standard: Academic Study Resource**\n\n1. **Summary:** Comprehensive instructional breakdown with derived formulas and illustrative numerical problems.\n2. **Key Formulas & Concept Map:**\n   - $\\mathcal{E} = -L \\frac{dI}{dt}$\n   - $\\omega_0 = \\frac{1}{\\sqrt{LC}}$\n\n3. **Action:** Read the chapter review and test your comprehension in the Adaptive Quiz Module.`);
}

/* --- Feedback System --- */
function handleSaveFeedback() {
  const cat = document.getElementById('fbCategory')?.value || 'Platform Usability';
  const rating = parseInt(document.getElementById('fbRating')?.value || '5');
  const comment = document.getElementById('fbComments')?.value?.trim();

  if (!comment) {
    showToast('Comment Required', 'Please share your remarks before submitting.', 'warning');
    return;
  }

  AppState.feedbackList.unshift({
    id: 'fb_' + Date.now(),
    author: `${AppState.currentUser.name} (${AppState.currentRole.toUpperCase()})`,
    category: cat,
    rating,
    comment,
    date: 'Just now'
  });

  saveAppState();
  toggleModal('modal-submit-feedback');
  renderFeedbackList();
  showToast('Feedback Submitted', 'Thank you for contributing to institutional quality!', 'success');
}

function renderFeedbackList() {
  const container = document.getElementById('feedbackEntriesList');
  if (!container) return;

  if (!AppState.feedbackList || AppState.feedbackList.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
        No feedback or reviews submitted yet. Click "+ Submit Executive Note" to record feedback.
      </div>
    `;
    if (typeof renderFeedbackSynthesisCard === 'function') {
      renderFeedbackSynthesisCard();
    }
    return;
  }

  container.innerHTML = AppState.feedbackList.map(f => `
    <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
      <div class="flex items-center justify-between">
        <span class="font-bold text-slate-800">${escapeHtml(f.author)}</span>
        <span class="text-amber-500 font-bold">${'★'.repeat(f.rating)}${'☆'.repeat(Math.max(0, 5 - f.rating))}</span>
      </div>
      <div class="flex items-center gap-2 text-[10px] text-slate-400">
        <span class="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-600">${escapeHtml(f.category)}</span>
        <span>${f.date}</span>
      </div>
      <p class="text-slate-600 leading-relaxed text-[11px] pt-1">"${escapeHtml(f.comment)}"</p>
    </div>
  `).join('');

  if (typeof renderFeedbackSynthesisCard === 'function') {
    renderFeedbackSynthesisCard();
  }
}

function triggerAiFeedbackSummarization() {
  if (!AppState.feedbackList || AppState.feedbackList.length === 0) {
    openAiResultModal("AI Feedback Synthesis", `### Institutional Sentiment Summary\n\n- **Sample Size:** 0 responses recorded.\n- **Status:** No institutional feedback submitted yet.\n- **Recommendation:** Submit feedback notes or student survey entries to enable AI aggregate sentiment analysis.`);
    return;
  }
  const count = AppState.feedbackList.length;
  const avg = (AppState.feedbackList.reduce((acc, f) => acc + (f.rating || 5), 0) / count).toFixed(1);
  openAiResultModal("AI Feedback Synthesis", `### Institutional Sentiment Summary\n\n- **Sample Size:** ${count} recorded submission(s).\n- **Overall Satisfaction:** ${avg} / 5.0\n- **Status:** Active feedback analysis completed.\n- **Recent Remarks:**\n${AppState.feedbackList.slice(0, 3).map(f => `• "${escapeHtml(f.comment)}" (${escapeHtml(f.category)})`).join('\n')}`);
}

/* --- Logout & Navigation --- */
function handleLogout(role) {
  showToast('Logging Out', 'Returning to login portal...', 'info');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 350);
}

/* Keyboard Shortcut: Ctrl + K for Smart Search */
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    if (typeof switchMainTab === 'function') {
      switchMainTab('smart-search');
    }
  }
});
