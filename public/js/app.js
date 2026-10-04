/* global SachetI18n, Tesseract, lucide */
const I18n = window.SachetI18n;

let currentLang = 'en';
let worker = null;

// DOM Elements
const msgInput = document.getElementById('msgInput');
const btnCheck = document.getElementById('btnCheck');
const btnCheckText = document.getElementById('btnCheckText');
const spinner = document.querySelector('.spinner');
const btnIcon = document.querySelector('.btn-icon');
const resultCard = document.getElementById('resultCard');

const langSelectMobile = document.getElementById('langSelectMobile');
const langPills = document.querySelectorAll('.lang-pill');
const themeToggle = document.getElementById('themeToggle');

const btnType = document.getElementById('btnType');
const btnImage = document.getElementById('btnImage');
const btnVoice = document.getElementById('btnVoice');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

// Theme Management
function toggleTheme() {
  const html = document.documentElement;
  html.classList.toggle('dark');
  localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
}
themeToggle.addEventListener('click', toggleTheme);

// Parallax & Reveal Animations
function initScrollAnimations() {
  const orbs = document.querySelectorAll('.orb');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    orbs[0].style.transform = `translateY(${y * 0.15}px)`;
    orbs[1].style.transform = `translateY(${y * 0.1}px) reverse`;
    orbs[2].style.transform = `translateY(${y * 0.05}px)`;
  }, { passive: true });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('active');
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// i18n
function applyI18n(lang) {
  currentLang = lang;
  const t = I18n.T[lang];
  document.documentElement.lang = lang;
  
  // Hero
  document.getElementById('heroTitle').textContent = t.tagline;
  document.getElementById('heroSub').textContent = t.inputLabel;
  document.getElementById('heroCta').textContent = t.check;
  document.getElementById('btnCheckText').textContent = t.check;
  document.getElementById('demoTitle').textContent = t.samplePick;
  
  // Placeholders
  msgInput.placeholder = t.placeholder;
  document.getElementById('dropText').textContent = t.upload;
  
  // Result text
  document.getElementById('flagsTitle').textContent = t.flagsTitle;
  document.getElementById('nextTitle').textContent = t.stepsTitle;
  
  // Actions
  document.getElementById('btnCyber').textContent = t.cyber;
  document.getElementById('btnSebi').textContent = t.verifySebi;
  document.getElementById('btnResetText').textContent = t.newCheck;
  
  // Info sections (Fallback to English if missing)
  document.getElementById('howTitle').textContent = t.howItWorks || 'How it works';
  document.getElementById('how1Title').textContent = t.how1 || '1. Paste';
  document.getElementById('how2Title').textContent = t.how2 || '2. Analyze';
  document.getElementById('how3Title').textContent = t.how3 || '3. Act';
  document.getElementById('privacyTitle').textContent = t.privacyTitle;
  
  renderDemos();
}

// Language Switching
function setLanguage(lang) {
  langSelectMobile.value = lang;
  langPills.forEach(p => {
    if (p.dataset.lang === lang) {
      p.classList.add('active');
      // Update pill indicator position
      const indicator = document.querySelector('.pill-indicator');
      if(indicator) indicator.style.transform = `translateX(${p.offsetLeft - 4}px)`;
    } else {
      p.classList.remove('active');
    }
  });
  applyI18n(lang);
}
langSelectMobile.addEventListener('change', e => setLanguage(e.target.value));
langPills.forEach(p => p.addEventListener('click', e => setLanguage(e.target.dataset.lang)));

// Demos
function renderDemos() {
  const container = document.getElementById('demoContainer');
  container.innerHTML = '';
  I18n.SAMPLES.forEach(sample => {
    const chip = document.createElement('button');
    chip.className = 'demo-chip';
    chip.textContent = sample.label;
    chip.onclick = () => { msgInput.value = sample.text; msgInput.focus(); resultCard.classList.add('hidden'); };
    container.appendChild(chip);
  });
}

// Input Modes
function setInputMode(mode) {
  btnType.classList.toggle('active', mode === 'type');
  btnImage.classList.toggle('active', mode === 'image');
  
  if (mode === 'image') {
    msgInput.classList.add('hidden');
    dropZone.classList.remove('hidden');
  } else {
    msgInput.classList.remove('hidden');
    dropZone.classList.add('hidden');
    msgInput.focus();
  }
}
btnType.addEventListener('click', () => setInputMode('type'));
btnImage.addEventListener('click', () => setInputMode('image'));

// File Drag/Drop
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault(); dropZone.classList.remove('dragover');
  if (e.dataTransfer.files[0]) handleImage(e.dataTransfer.files[0]);
});
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => { if (e.target.files[0]) handleImage(e.target.files[0]); });

async function handleImage(file) {
  if (!file.type.startsWith('image/')) return alert('Please upload an image.');
  document.getElementById('dropText').textContent = 'Reading text...';
  try {
    if (!worker) {
      worker = await Tesseract.createWorker();
      await worker.loadLanguage('eng+hin');
      await worker.initialize('eng+hin');
    }
    const { data: { text } } = await worker.recognize(file);
    msgInput.value = text;
    setInputMode('type');
  } catch (err) {
    alert('Failed to read image.');
  } finally {
    document.getElementById('dropText').textContent = I18n.T[currentLang].upload;
  }
}

// Voice Input
let recognition = null;
if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.onstart = () => btnVoice.classList.add('listening');
  recognition.onend = () => btnVoice.classList.remove('listening');
  recognition.onresult = (e) => {
    let final = '';
    for (let i = e.resultIndex; i < e.results.length; ++i) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript;
    }
    if (final) msgInput.value += (msgInput.value ? ' ' : '') + final;
  };
  btnVoice.addEventListener('click', () => {
    if (btnVoice.classList.contains('listening')) recognition.stop();
    else { recognition.lang = currentLang === 'en' ? 'en-IN' : `${currentLang}-IN`; recognition.start(); }
  });
} else {
  btnVoice.style.display = 'none';
}

// Auto-grow textarea
msgInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
});

// Main Analysis
btnCheck.addEventListener('click', async () => {
  const text = msgInput.value.trim();
  if (!text) return msgInput.focus();

  // UI state
  btnCheck.disabled = true;
  btnCheckText.textContent = 'Checking...';
  spinner.classList.remove('hidden');
  btnIcon.classList.add('hidden');
  resultCard.classList.add('hidden');

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: currentLang, text })
    });
    
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    renderResult(data);
  } catch (err) {
    console.error(err);
    alert('Error: ' + err.message);
  } finally {
    btnCheck.disabled = false;
    btnCheckText.textContent = I18n.T[currentLang].check;
    spinner.classList.add('hidden');
    btnIcon.classList.remove('hidden');
  }
});

function renderResult(data) {
  const riskLabel = document.getElementById('riskLabel');
  const riskBadge = document.getElementById('riskBadge');
  const riskIconContainer = document.getElementById('riskIconContainer');
  
  riskBadge.className = 'risk-badge';
  riskLabel.textContent = I18n.T[currentLang]['risk_' + data.risk_level] || data.risk_level;
  
  if (data.risk_level === 'High') {
    riskBadge.classList.add('risk-high');
    if (riskIconContainer) riskIconContainer.innerHTML = '<i data-lucide="alert-triangle"></i>';
    gaugeFill.className = 'gauge-fill gauge-high';
  } else if (data.risk_level === 'Medium') {
    riskBadge.classList.add('risk-medium');
    if (riskIconContainer) riskIconContainer.innerHTML = '<i data-lucide="alert-circle"></i>';
    gaugeFill.className = 'gauge-fill gauge-medium';
  } else {
    riskBadge.classList.add('risk-low');
    if (riskIconContainer) riskIconContainer.innerHTML = '<i data-lucide="check-circle"></i>';
    gaugeFill.className = 'gauge-fill gauge-low';
  }

  // Chips
  const flagsContainer = document.getElementById('redFlags');
  flagsContainer.innerHTML = '';
  data.red_flags.forEach(flag => {
    const f = document.createElement('span');
    f.className = 'flag-chip';
    f.textContent = flag;
    flagsContainer.appendChild(f);
  });

  document.getElementById('explanationText').textContent = data.plain_explanation;

  const nextContainer = document.getElementById('nextSteps');
  nextContainer.innerHTML = '';
  data.next_steps.forEach((step, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="checklist-num">${i+1}</span><span>${step}</span>`;
    nextContainer.appendChild(li);
  });

  document.getElementById('uncertaintyText').textContent = data.uncertainty_note;

  lucide.createIcons();
  resultCard.classList.remove('hidden');
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  window.lastResultData = data; // for speech synthesis
}

// Reset
document.getElementById('btnReset').addEventListener('click', () => {
  msgInput.value = '';
  resultCard.classList.add('hidden');
  msgInput.focus();
});

// Scroll CTA
document.getElementById('scrollBtn').addEventListener('click', () => {
  document.getElementById('checker').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Speech Synthesis
document.getElementById('btnSpeak').addEventListener('click', () => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  
  if (!window.lastResultData) return;
  const d = window.lastResultData;
  const riskText = I18n.T[currentLang]['risk_' + d.risk_level] || d.risk_level;
  const textToRead = `${riskText}. ${d.plain_explanation}`;
  
  const u = new SpeechSynthesisUtterance(textToRead);
  u.lang = currentLang === 'en' ? 'en-IN' : `${currentLang}-IN`;
  window.speechSynthesis.speak(u);
});

// Init
setLanguage('en');
// Initial pill position
setTimeout(() => setLanguage('en'), 50);

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('active');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
initScrollAnimations();
 
