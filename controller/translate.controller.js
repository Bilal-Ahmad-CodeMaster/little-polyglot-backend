const translationCache = new Map();
const MAX_CACHE_ENTRIES = 5000;

const translateOne = async (text, source, target) => {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
    source
  )}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google translate failed with ${response.status}`);
  }

  const data = await response.json();
  return (data?.[0] || []).map((row) => row?.[0] || "").join("");
};

const cacheKey = (source, target, text) => `${source}|${target}|${text}`;

const remember = (key, value) => {
  if (translationCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = translationCache.keys().next().value;
    translationCache.delete(firstKey);
  }
  translationCache.set(key, value);
};

const runWithConcurrency = async (items, limit, worker) => {
  const results = new Array(items.length);
  let nextIndex = 0;

  const run = async () => {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await worker(items[current], current);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run())
  );
  return results;
};

export const translateTexts = async (req, res) => {
  try {
    const { texts, target, source = "pl" } = req.body || {};

    if (!Array.isArray(texts) || typeof target !== "string" || !target.trim()) {
      return res.status(400).json({
        message: "Request must include texts[] and a target language code.",
      });
    }

    if (texts.length > 100) {
      return res.status(400).json({
        message: "A maximum of 100 texts can be translated per request.",
      });
    }

    const normalizedTarget = target.trim();
    const normalizedSource = source.trim() || "pl";

    if (normalizedTarget === normalizedSource) {
      return res.status(200).json({ data: texts });
    }

    const translated = await runWithConcurrency(texts, 4, async (text) => {
      if (typeof text !== "string" || !text.trim()) {
        return text;
      }

      const key = cacheKey(normalizedSource, normalizedTarget, text);
      if (translationCache.has(key)) {
        return translationCache.get(key);
      }

      try {
        const result = await translateOne(
          text.slice(0, 4500),
          normalizedSource,
          normalizedTarget
        );
        const output = result || text;
        remember(key, output);
        return output;
      } catch (error) {
        console.error("Translation failed for a text item:", error.message);
        return text;
      }
    });

    return res.status(200).json({ data: translated });
  } catch (error) {
    console.error("Translation endpoint error:", error);
    return res.status(500).json({ message: "Translation failed." });
  }
};
