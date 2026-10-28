// Configuración global de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Estado global de la aplicación
let currentRecipient = "Estudiante Académico";
let tasks = [];
let timerInterval = null;
let timerSeconds = 25 * 60;
let isTimerRunning = false;
let currentTimerMode = 'work'; // 'work', 'shortBreak', 'longBreak'
const timerDurations = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
};

// Configuración de Sintetizador de Voz (Text-To-Speech)
const synth = window.speechSynthesis;
let availableVoices = [];

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  populateVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoices;
  }
  renderTasks();
});

// Cambiar de pestañas (Estudio / Tiempo)
function switchTab(tabName) {
  const studyTab = document.getElementById('tab-study');
  const timerTab = document.getElementById('tab-timer');
  const studyBtn = document.getElementById('tab-study-btn');
  const timerBtn = document.getElementById('tab-timer-btn');

  if (tabName === 'study') {
    studyTab.classList.remove('hidden');
    studyTab.classList.add('grid');
    timerTab.classList.add('hidden');
    timerTab.classList.remove('grid');

    studyBtn.className = "px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 bg-indigo-600 text-white shadow-lg shadow-indigo-600/30";
    timerBtn.className = "px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 text-slate-400 hover:text-slate-200";
  } else {
    timerTab.classList.remove('hidden');
    timerTab.classList.add('grid');
    studyTab.classList.add('hidden');
    studyTab.classList.remove('grid');

    timerBtn.className = "px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 bg-indigo-600 text-white shadow-lg shadow-indigo-600/30";
    studyBtn.className = "px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 text-slate-400 hover:text-slate-200";
  }
}

// Personalización de destinatario principal
function editRecipient() {
  const newName = prompt("Ingresa el nombre del destinatario de la plataforma:", currentRecipient);
  if (newName && newName.trim() !== "") {
    currentRecipient = newName.trim();
    document.getElementById('user-display').textContent = currentRecipient;
  }
}

// Actualizar contador de caracteres
function updateCharCount() {
  const text = document.getElementById('text-input').value;
  document.getElementById('char-count').textContent = `${text.length} caracteres`;
}

// Limpiar cuadro de texto
function clearText() {
  document.getElementById('text-input').value = '';
  document.getElementById('output-box').innerHTML = `
    <div class="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
      <i data-lucide="brain-circuit" class="w-12 h-12 mb-3 text-slate-600"></i>
      <p>Selecciona una opción para procesar información.</p>
    </div>`;
  lucide.createIcons();
  updateCharCount();
  stopSpeech();
}

// Procesar lectura de archivos PDF / DOCX / TXT
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileName = file.name;
  const extension = fileName.split('.').pop().toLowerCase();

  try {
    if (extension === 'txt') {
      const text = await file.text();
      document.getElementById('text-input').value = text;
    } else if (extension === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      document.getElementById('text-input').value = fullText;
    } else if (extension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      document.getElementById('text-input').value = result.value;
    } else {
      alert("Formato no soportado. Por favor sube un archivo PDF, DOCX o TXT.");
    }
    updateCharCount();
  } catch (error) {
    console.error("Error al procesar el archivo:", error);
    alert("Hubo un error al leer el archivo.");
  }
}

// Algoritmos de Procesamiento Académico
function processText(mode) {
  const text = document.getElementById('text-input').value.trim();
  const outputBox = document.getElementById('output-box');

  if (!text) {
    alert("Por favor introduce o carga un texto primero.");
    return;
  }

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  if (mode === 'summarize') {
    // Selección estratégica de oraciones para resumen
    const summaryLength = Math.max(1, Math.ceil(sentences.length * 0.4));
    const summary = sentences.slice(0, summaryLength).join(' ');
    outputBox.innerHTML = `<h4 class="font-bold text-indigo-400 mb-2">Resumen Ejecutivo:</h4><p>${summary}</p>`;
  } 
  else if (mode === 'ideas') {
    // Extracción de ideas principales y secundarias
    const mainIdeas = sentences.filter((_, idx) => idx % 2 === 0).slice(0, 4);
    const secondaryIdeas = sentences.filter((_, idx) => idx % 2 !== 0).slice(0, 4);

    let html = `<h4 class="font-bold text-purple-400 mb-2">Ideas Principales:</h4><ul class="list-disc list-inside mb-4 space-y-1">`;
    mainIdeas.forEach(idea => { html += `<li>${idea.trim()}</li>`; });
    html += `</ul><h4 class="font-bold text-indigo-400 mb-2">Ideas Secundarias:</h4><ul class="list-disc list-inside space-y-1">`;
    secondaryIdeas.forEach(idea => { html += `<li>${idea.trim()}</li>`; });
    html += `</ul>`;

    outputBox.innerHTML = html;
  } 
  else if (mode === 'translate') {
    // Traducción demostrativa
    outputBox.innerHTML = `<h4 class="font-bold text-teal-400 mb-2">Traducción (Inglés Académico):</h4><p>[Traducción simulada del texto procesado]: ${text}</p>`;
  }
}

// Configuración y ejecución de Sintetizador de Voz (Text-To-Speech)
function populateVoices() {
  availableVoices = synth.getVoices();
  const voiceSelect = document.getElementById('voice-select');
  voiceSelect.innerHTML = '';

  availableVoices.forEach((voice, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${voice.name} (${voice.lang})`;
    if (voice.lang.includes('es')) {
      option.selected = true;
    }
    voiceSelect.appendChild(option);
  });
}

function toggleSpeech() {
  if (synth.speaking) {
    if (synth.paused) {
      synth.resume();
      updateTTSBtn(true);
    } else {
      synth.pause();
      updateTTSBtn(false);
    }
    return;
  }

  const outputText = document.getElementById('output-box').innerText;
  if (!outputText || outputText.includes("Selecciona una opción")) {
    alert("No hay ningún resultado procesado para leer.");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(outputText);
  const selectedVoiceIndex = document.getElementById('voice-select').value;
  
  if (availableVoices[selectedVoiceIndex]) {
    utterance.voice = availableVoices[selectedVoiceIndex];
  }

  utterance.onend = () => updateTTSBtn(false);
  utterance.onerror = () => updateTTSBtn(false);

  synth.speak(utterance);
  updateTTSBtn(true);
}

function stopSpeech() {
  if (synth.speaking) {
    synth.cancel();
    updateTTSBtn(false);
  }
}

function updateTTSBtn(isPlaying) {
  const icon = document.getElementById('tts-icon');
  if (isPlaying) {
    icon.setAttribute('data-lucide', 'pause');
  } else {
    icon.setAttribute('data-lucide', 'volume-2');
  }
  lucide.createIcons();
}

// Gestión del Temporizador
function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  document.getElementById('timer-display').textContent = 
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function toggleTimer() {
  const toggleIcon = document.getElementById('timer-toggle-icon');

  if (isTimerRunning) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    toggleIcon.setAttribute('data-lucide', 'play');
  } else {
    isTimerRunning = true;
    toggleIcon.setAttribute('data-lucide', 'pause');
    timerInterval = setInterval(() => {
      if (timerSeconds > 0) {
        timerSeconds--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        alert("¡Bloque finalizado!");
        toggleIcon.setAttribute('data-lucide', 'play');
      }
    }, 1000);
  }
  lucide.createIcons();
}

function resetTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timerSeconds = timerDurations[currentTimerMode];
  updateTimerDisplay();
  document.getElementById('timer-toggle-icon').setAttribute('data-lucide', 'play');
  lucide.createIcons();
}

function setTimerMode(mode) {
  currentTimerMode = mode;
  const label = document.getElementById('timer-label');
  if (mode === 'work') label.textContent = 'BLOQUE DE ESTUDIO';
  else if (mode === 'shortBreak') label.textContent = 'PAUSA CORTA';
  else if (mode === 'longBreak') label.textContent = 'DESCANSO LARGO';

  resetTimer();
}

// Gestión de Lista de Tareas
function addTask(event) {
  event.preventDefault();
  const titleInput = document.getElementById('task-title-input');
  const blocksInput = document.getElementById('task-blocks-input');

  const newTask = {
    id: Date.now(),
    title: titleInput.value.trim(),
    blocks: parseInt(blocksInput.value) || 1,
    completed: false
  };

  tasks.push(newTask);
  titleInput.value = '';
  blocksInput.value = '1';
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
}

function renderTasks() {
  const tasksList = document.getElementById('tasks-list');
  if (tasks.length === 0) {
    tasksList.innerHTML = `<p class="text-xs text-slate-500 text-center py-6">No hay tareas o asignaciones agregadas.</p>`;
    return;
  }

  tasksList.innerHTML = tasks.map(task => `
    <div class="flex items-center justify-between bg-slate-900/60 border border-slate-700/60 p-3 rounded-xl">
      <div class="flex items-center gap-3">
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})" class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500">
        <span class="text-sm font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}">${task.title}</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-mono">${task.blocks} Bloque(s)</span>
        <button onclick="deleteTask(${task.id})" class="text-slate-500 hover:text-red-400 transition">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `).join('');

  lucide.createIcons();
}