/**
 * Сервис для генерации баннеров мероприятий с помощью ИИ (Pollinations.ai)
 */

export const STYLE_PRESETS = {
  photorealistic: {
    label: '📸 Реализм',
    positive: 'hyper-realistic, photorealistic style, 8k, cinematic, professional camera, sharp focus, high detail, no generic logos',
    negative: 'cartoon, anime, 3d, render, illustration, painting, blurry, low resolution, text, watermark'
  },
  '3d-render': {
    label: '🎨 3D Рендер',
    positive: 'detailed 3d isometric render, unreal engine 5, octane render, smooth surfaces, game art, toy-like aesthetic, soft lighting',
    negative: 'photo, realistic, painting, blurry, low resolution, text, watermark'
  },
  cyberpunk: {
    label: '🌃 Киберпанк',
    positive: 'intense cyberpunk aesthetic, futuristic neon city, glow effects, sci-fi atmosphere, dramatic lighting, synthwave palette, cybernetic details',
    negative: 'photorealistic, realism, real photo, stock photo, documentary style, logo, watermark, text'
  },
  painting: {
    label: '🖼️ Живопись',
    positive: 'artistic oil painting, visible brushstrokes, canvas texture, classical masterpiece style, rich colors, expressive',
    negative: 'photo, realistic, digital render, sharp lines, text, watermark, low quality'
  },
  abstract: {
    label: '☄️ Абстракция',
    positive: 'dynamic abstract art, explosion of colors, fluid motion, artistic composition, non-representative, geometrical patterns',
    negative: 'realistic objects, people, faces, text, sharp photography, animal'
  },
  watercolor: {
    label: '🖌️ Акварель',
    positive: 'beautiful watercolor painting, soft edges, paper texture, artistic ink splashes, dreamlike atmosphere',
    negative: 'photo, 3d, sharp, high contrast, text, watermark'
  },
  neon: {
    label: '💡 Неон',
    positive: 'vibrant neon light art, glowing tubes, dark background, electric colors, minimalist composition',
    negative: 'daylight, realistic, photo, blurry, low resolution'
  }
};

/**
 * Перевод ключевых слов с русского на английский для промпта
 */
const translateKeywords = (text) => {
  if (!text) return 'event';
  
  const mapping = {
    'футбол': 'soccer football match stadium',
    'баскетбол': 'basketball game arena',
    'спорт': 'sports competition athletes',
    'концерт': 'music concert stage live performance',
    'шоу': 'entertainment show performance',
    'выставка': 'art exhibition gallery',
    'фестиваль': 'festival celebration crowd outdoor',
    'театр': 'theater drama stage acting',
    'кино': 'cinema movie theater',
    'астана': 'Astana city skyline',
    'алматы': 'Almaty mountains city',
    'шымкент': 'Shymkent sunny city',
    'бизнес': 'business conference networking',
    'марафон': 'running marathon race',
    'клуб': 'club music dancing',
    'вечеринка': 'party celebration people having fun',
    'встреча': 'meeting gathering',
    'мастер-класс': 'workshop learning masterclass',
    'лекция': 'lecture presentation',
    'выставка': 'exhibition art gallery display',
    'туризм': 'tourism travel adventure nature',
    'банано': 'banana yellow vibrant colorful creative style',
    'нано': 'high-tech futuristic nano technology details'
  };

  let translated = text.toLowerCase();
  Object.keys(mapping).forEach(key => {
    const regex = new RegExp(key, 'gi');
    translated = translated.replace(regex, mapping[key]);
  });

  // Удаляем кавычки и лишние символы
  return translated.replace(/["']/g, "").trim();
};

/**
 * Функция для расширения промпта через Gemini (если есть ключ)
 */
const expandPromptWithGemini = async (title, category, style, apiKey) => {
  if (!apiKey) return null;
  
  // Пробуем сначала flash, потом pro (на случай проблем с доступностью моделей)
  const geminiModels = ['gemini-1.5-flash', 'gemini-pro'];
  
  for (const modelName of geminiModels) {
    try {
      console.log(`Trying Gemini model: ${modelName}...`);
      const prompt = `You are a professional AI image prompt engineer. Expand the following event details into a highly detailed, artistic, and cinematic prompt for an image generator (like Flux or Midjourney). 
      Event: "${title}"
      Category: "${category}"
      Style: "${style}"
      
      Requirements:
      - Describe the scene, lighting, colors, and camera angle.
      - DO NOT include any text, letters, or logos.
      - Keep it under 100 words. 
      - Output ONLY the expanded prompt in English.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!res.ok) {
          console.warn(`Gemini ${modelName} failed with status ${res.status}`);
          continue; // Пробуем следующую модель
      }

      const data = await res.json();
      const expandedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (expandedText) {
          console.log(`Gemini Success (${modelName})! Expanded prompt:`, expandedText);
          return expandedText;
      }
    } catch (err) {
      console.error(`Gemini ${modelName} error:`, err.message);
    }
  }
  return null;
};

/**
 * Главная функция генерации баннера
 */
export const generateEventBanner = async (title, category, styleKey = 'photorealistic') => {
  console.log("AI SERVICE VERSION: 3.2 (Gemini Fallback + Direct URL)");
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log("Gemini Key Status:", apiKey ? "DETECTED" : "MISSING");
  
  const cleanTitle = translateKeywords(title);
  const themeKeywords = translateKeywords(category);
  const preset = STYLE_PRESETS[styleKey] || STYLE_PRESETS.photorealistic;

  // 1. Пытаемся расширить промпт через Gemini (но не ждем вечно)
  const expandedPrompt = await expandPromptWithGemini(title, category, preset.positive, apiKey);

  const seed = Math.floor(Math.random() * 10000000);
  const currentModel = 'flux'; 
  
  const promptParams = new URLSearchParams({
    width: '1024',
    height: '576',
    seed: String(seed),
    nologo: 'true',
    enhance: 'true',
    model: currentModel
  });

  const qualityFilters = 'masterpiece, high quality, highly detailed';
  const mainPromptString = expandedPrompt || `${preset.positive}, ${themeKeywords}, ${cleanTitle}`;
  const finalPrompt = `${mainPromptString}, ${qualityFilters}, professional photography, no text, no letters`;
  
  const finalUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?${promptParams.toString()}`;
  
  console.log("FINAL URL PRODUCED:", finalUrl);
  return finalUrl;
};
