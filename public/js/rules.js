/*
 * Sachet — shared privacy masking + rule-based red-flag engine.
 * Runs identically in the browser (instant, offline) and on the server
 * (defence-in-depth: the server re-masks everything before any LLM call).
 * No data is stored anywhere.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SachetRules = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. PRIVACY MASKING (order matters: emails -> UPI -> cards/accounts -> phones)
  // ---------------------------------------------------------------------------
  const MASKS = [
    { key: 'EMAIL', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g },
    // UPI handle: something@bankhandle (no dot in handle), e.g. rahul.k@okaxis, 98xxxx@ybl
    { key: 'UPI_ID', re: /[A-Za-z0-9._-]{2,256}@[A-Za-z][A-Za-z0-9]{1,64}\b/g },
    { key: 'PAN', re: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g },
    { key: 'AADHAAR', re: /\b[2-9][0-9]{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/g },
    { key: 'CARD', re: /\b(?:\d[ -]?){15,16}\b/g },
    // Indian mobile numbers with optional +91 / 0 prefix and separators
    { key: 'PHONE', re: /(?:(?:\+|\b)91[\s-]?)?(?<!\d)[6-9](?:[\s-]?\d){9}(?!\d)/g },
    { key: 'ACCOUNT_NO', re: /\b\d{9,18}\b/g },
    { key: 'OTP', re: /\b(?:otp|OTP|पिन|PIN)\s*[:\-]?\s*\d{4,8}\b/g },
  ];

  function maskPII(text) {
    let out = String(text || '');
    const counts = {};
    for (const m of MASKS) {
      out = out.replace(m.re, () => {
        counts[m.key] = (counts[m.key] || 0) + 1;
        return `[${m.key}]`;
      });
    }
    return { masked: out, counts };
  }

  // ---------------------------------------------------------------------------
  // 2. RED-FLAG RULES (English + Hinglish + Hindi/Marathi/Tamil/Telugu/Bengali)
  // ---------------------------------------------------------------------------
  const RULES = [
    {
      id: 'guaranteed_returns',
      weight: 3,
      patterns: [
        /guarante+d?/i, /assured\s+(return|profit|income)/i, /fixed\s+(return|profit)/i,
        /risk[\s-]?free/i, /no\s+risk/i, /zero\s+risk/i, /100\s*%\s*(profit|return|safe|sure)/i,
        /double\s+(your|the)?\s*(money|investment|capital)/i, /money\s+double/i, /paisa\s+double/i,
        /\d+(\.\d+)?\s*%\s*(daily|per\s*day|a\s*day|weekly|per\s*week|monthly|per\s*month|a\s*month|roz|rozana|har\s*din|prati\s*din)/i,
        /\d+\s*x\s+returns?/i, /pakka\s+(profit|munafa)/i,
        /गारंटी/, /पक्का\s*मुनाफा/, /दोगुना/, /दुगना/, /निश्चित\s*(रिटर्न|लाभ|मुनाफा)/, /बिना\s*जोखिम/,
        /हमखास/, /खात्रीशीर/, /दुप्पट/,
        /உத்தரவாத/, /இரட்டிப்பு/, /நிச்சய\s*லாப/,
        /హామీ/, /రెట్టింపు/, /గ్యారంటీ/,
        /গ্যারান্টি/, /নিশ্চিত\s*(লাভ|রিটার্ন)/, /দ্বিগুণ/,
      ],
    },
    {
      id: 'urgency',
      weight: 2,
      patterns: [
        /limited\s+(seats?|slots?|time|offer|period)/i, /only\s+today/i, /today\s+only/i, /hurry/i,
        /last\s+(chance|day|few)/i, /act\s+(now|fast)/i, /within\s+\d+\s*(hours?|hrs?|minutes?|mins?)/i,
        /offer\s+(ends|closing|expires)/i, /urgent/i, /immediately/i, /don'?t\s+miss/i, /before\s+it'?s\s+too\s+late/i,
        /jaldi/i, /abhi\s+(join|invest|pay)/i, /aaj\s+hi/i,
        /जल्दी/, /आज\s*ही/, /सीमित/, /तुरंत/, /अंतिम\s*मौका/, /ताबडतोब/, /लगेच/, /शेवटची\s*संधी/,
        /உடனே/, /இன்று\s*மட்டும்/, /கடைசி\s*வாய்ப்பு/,
        /వెంటనే/, /ఈరోజే/, /చివరి\s*అవకాశం/,
        /এখনই/, /আজই/, /শেষ\s*সুযোগ/, /তাড়াতাড়ি/,
      ],
    },
    {
      id: 'insider_tips',
      weight: 3,
      patterns: [
        /insider/i, /inside\s+(info|information|news)/i, /sure[\s-]?shot/i, /jackpot/i, /operator\s+(call|stock|game)/i,
        /upper\s+circuit/i, /multi[\s-]?bagger/i, /secret\s+(tip|stock|call)/i, /100\s*%\s*accurate/i,
        /confirmed\s+(call|tip|target)/i, /target\s+(hit|achieved)/i, /pump/i, /exclusive\s+(tip|call)/i,
        /pakki\s+tip/i, /andar\s+ki\s+khabar/i,
        /अंदर\s*की\s*खबर/, /पक्की\s*टिप/, /गुप्त\s*टिप/, /ऑपरेटर/,
        /உள்\s*தகவல்/, /ரகசிய\s*டிப்/,
        /ఇన్‌సైడ్\s*సమాచారం/, /రహస్య\s*టిప్/, /లోపలి\s*సమాచారం/,
        /ভেতরের\s*খবর/, /গোপন\s*টিপ/,
      ],
    },
    {
      id: 'private_groups',
      weight: 2,
      patterns: [
        /whats\s?app/i, /telegram/i, /t\.me\//i, /chat\.whatsapp\.com/i, /join\s+(our|my|the)?\s*(vip|premium|private|paid)?\s*(group|channel)/i,
        /vip\s+(group|channel|club)/i, /premium\s+(group|channel)/i, /signal\s+group/i, /\bdm\s+me\b/i, /inbox\s+me/i,
        /व्हाट्सएप/, /व्हॉट्सॲप/, /टेलीग्राम/, /टेलिग्राम/, /ग्रुप/,
        /வாட்ஸ்அப்/, /டெலிகிராம்/, /குழு/,
        /వాట్సాప్/, /టెలిగ్రామ్/, /గ్రూప్/,
        /হোয়াটসঅ্যাপ/, /টেলিগ্রাম/, /গ্রুপ/,
      ],
    },
    {
      id: 'personal_payment',
      weight: 3,
      patterns: [
        /\[UPI_ID\]/, /\[ACCOUNT_NO\]/, /\bupi\b/i, /g\s?pay/i, /phone\s?pe/i, /paytm/i, /qr\s*code/i,
        /send\s+(the\s+)?(money|payment|amount|fees?)/i, /transfer\s+(to|in)\s+(my|this|our)/i, /personal\s+account/i,
        /(registration|joining|activation|membership|processing|withdrawal)\s+(fee|charge|amount)/i, /advance\s+(fee|payment)/i,
        /pay\s+(rs\.?|₹|inr)?\s*\d+/i, /paise\s+bhej/i,
        /पैसे\s*भेज/, /भुगतान\s*कर/, /शुल्क/, /पैसे\s*पाठव/,
        /பணம்\s*அனுப்ப/, /கட்டணம்/,
        /డబ్బు\s*పంప/, /రుసుము/,
        /টাকা\s*পাঠা/, /ফি\s*দিন/,
      ],
    },
    {
      id: 'unregistered_advisor',
      weight: 2,
      patterns: [
        /\badvis[oe]r\b/i, /\bexpert\b/i, /\banalyst\b/i, /\bguru\b/i, /\bmentor\b/i, /research\s+analyst/i,
        /trading\s+(coach|academy|mentor)/i, /portfolio\s+manager/i, /fund\s+manager/i, /no\s+sebi/i, /sebi\s+not\s+required/i,
        /सलाहकार/, /एक्सपर्ट/, /गुरु/, /सल्लागार/, /तज्ज्ञ/,
        /ஆலோசகர்/, /நிபுணர்/,
        /సలహాదారు/, /నిపుణుడు/,
        /উপদেষ্টা/, /বিশেষজ্ঞ/,
      ],
      // Only a flag if no SEBI-style registration number is quoted.
      unless: /\bIN[AHZP]\d{9}\b/i,
    },
    {
      id: 'sensitive_request',
      weight: 4,
      patterns: [
        /(?<!(?:never|not|n't|dont|mat|na)\s+)(share|send|tell|give|forward|enter)\s+(the\s+|your\s+|us\s+)?(otp|upi\s*pin|atm\s*pin|password|cvv)/i,
        /\b(otp|pin)\s+(share|bhej|batao|send|do|dijiye)/i, /any\s?desk/i, /team\s?viewer/i, /screen\s+shar/i,
        /\.apk\b/i, /download\s+(this|our|the)\s+app/i, /kyc\s+(update|expire|block)/i, /account\s+(will\s+be\s+)?(blocked|suspended|frozen)/i,
        /(ओटीपी|OTP)\s*(भेज|बता|शेयर|दें)/i, /पासवर्ड\s*(भेज|बता)/, /केवाईसी\s*(अपडेट|बंद)/,
        /(ஓடிபி|OTP)\s*(பகிர|அனுப்ப)/i,
        /(ఓటీపీ|OTP)\s*(షేర్|పంప)/i, /యాప్\s*డౌన్‌?లోడ్/,
        /(ওটিপি|OTP)\s*(দিন|পাঠা|শেয়ার)/i,
      ],
    },
    {
      id: 'impersonation',
      weight: 2,
      patterns: [
        /sebi\s+(approved|certified|authori[sz]ed)\s+(scheme|plan|group|app)/i, /institutional\s+account/i, /ipo\s+allotment\s+guarante/i,
        /pre[\s-]?ipo/i, /block\s+deal\s+access/i, /foreign\s+institutional/i, /\bfii\s+account/i, /from\s+(sebi|rbi|nse|bse)\s+office/i,
        /सेबी\s*(से\s*)?(मान्यता|प्रमाणित)/,
      ],
    },
  ];

  function detect(text) {
    const src = String(text || '');
    const hits = [];
    for (const rule of RULES) {
      const matched = [];
      for (const p of rule.patterns) {
        const m = src.match(p);
        if (m) matched.push(m[0]);
      }
      if (!matched.length) continue;
      if (rule.unless && rule.unless.test(src)) continue;
      hits.push({ id: rule.id, weight: rule.weight, evidence: Array.from(new Set(matched)).slice(0, 3) });
    }
    const score = hits.reduce((s, h) => s + h.weight, 0);
    const ids = new Set(hits.map((h) => h.id));
    let risk = 'Unclear';
    if (
      score >= 7 || ids.has('sensitive_request') ||
      (ids.has('guaranteed_returns') && (ids.has('personal_payment') || ids.has('private_groups') || ids.has('insider_tips')))
    ) risk = 'High';
    else if (score >= 2) risk = 'Medium';
    const hasSebiReg = /\bIN[AHZP]\d{9}\b/i.test(src);
    return { risk, score, hits, hasSebiReg };
  }

  const ORDER = { Unclear: 0, Medium: 1, High: 2 };
  function maxRisk(a, b) { return (ORDER[a] ?? 0) >= (ORDER[b] ?? 0) ? a : b; }

  return { maskPII, detect, maxRisk, RULE_IDS: RULES.map((r) => r.id) };
});
