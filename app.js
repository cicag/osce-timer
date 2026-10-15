const TOTAL_ROTATION = 11;
const ROTATION_TIME = 900;
const FREEZE_TIME = 480;

let rotation = 1;
let remaining = ROTATION_TIME;
let interval = null;
let running = false;
let freezeMode = false;
let isContinued = false;

const timerEl = document.getElementById('timer');
const phaseEl = document.getElementById('phase');
const messageEl = document.getElementById('message');
const rotationEl = document.getElementById('rotation');
const progressEl = document.getElementById('progress');
const progressFillEl = document.getElementById('progress-fill');
const appEl = document.getElementById('osce-app');
const startBtnEl = document.getElementById('start-btn');

function speak(text){
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'id-ID';
        window.speechSynthesis.speak(utter);
    }
}

function setPhase(name){
    appEl.classList.remove('phase-reading','phase-exam','phase-warning','phase-move','phase-freeze');
    appEl.classList.add('phase-' + name);
}

function setRotation(n){
    rotationEl.textContent = 'Rotasi ' + n + ' / ' + TOTAL_ROTATION;
}

function updateDisplay(){
    const minutes = Math.floor(remaining/60);
    const seconds = remaining%60;
    timerEl.textContent = String(minutes).padStart(2,'0') + ':' + String(seconds).padStart(2,'0');
    const total = freezeMode ? FREEZE_TIME : ROTATION_TIME;
    const pct = Math.round(Math.max(0, Math.min(1, remaining / total)) * 100);
    progressFillEl.style.width = pct + '%';
    progressEl.setAttribute('aria-valuenow', pct);
    updatePhase();
}

function updatePhase(){
    phaseEl.classList.remove('is-blinking');
    if(freezeMode){
        phaseEl.textContent = 'FREEZE';
        setPhase('freeze');
        if(remaining > 420){
            messageEl.textContent = 'Freeze dimulai. Penguji istirahat dan peserta menunggu di depan stase';
        } else if(remaining <= 60){
            messageEl.textContent = 'Penguji dipersilakan kembali ke ruangan';
        } else {
            messageEl.textContent = 'Freeze berlangsung';
        }
        return;
    }
    const elapsed = ROTATION_TIME - remaining;
    if(elapsed < 60){
        phaseEl.textContent = 'MEMBACA SOAL';
        messageEl.textContent = 'Peserta membaca soal';
        setPhase('reading');
    }
    else if(elapsed < 780){
        phaseEl.textContent = 'PELAKSANAAN UJIAN';
        messageEl.textContent = 'Pelaksanaan ujian berlangsung';
        setPhase('exam');
    }
    else if(elapsed < 840){
        phaseEl.textContent = 'WARNING';
        messageEl.textContent = 'Waktu tersisa 1 menit';
        setPhase('warning');
        phaseEl.classList.add('is-blinking');
    }
    else{
        phaseEl.textContent = 'PINDAH STASE';
        messageEl.textContent = 'Silakan berpindah stase';
        setPhase('move');
    }
}

function advanceRotation(){
    rotation++;
    if(rotation > TOTAL_ROTATION){
        finishOSCE();
        return;
    }
    remaining = ROTATION_TIME;
    setRotation(rotation);
    syncRotationButtons();
    speak('Rotasi ' + rotation + ' dimulai');
    updateDisplay();
}

function nextStage(){
    isContinued = false;
    if(freezeMode){
        freezeMode = false;
        advanceRotation();
        return;
    }
    if(rotation === 6){
        freezeMode = true;
        remaining = FREEZE_TIME;
        speak('Freeze dimulai. Penguji istirahat dan peserta menunggu di depan stase');
        updateDisplay();
        return;
    }
    advanceRotation();
}

function syncRotationButtons() {
    document.querySelectorAll('.rot-btn').forEach((btn, i) => {
        btn.setAttribute('aria-pressed', (i + 1) === rotation ? 'true' : 'false');
    });
}

function finishOSCE(){
    clearInterval(interval);
    running = false;
    isContinued = false;
    startBtnEl.textContent = 'Mulai';
    phaseEl.textContent = 'SELESAI';
    phaseEl.classList.remove('is-blinking');
    messageEl.textContent = 'OSCE telah selesai';
    timerEl.textContent = '00:00';
    setPhase('reading');
    progressFillEl.style.width = '0%';
    progressEl.setAttribute('aria-valuenow', 0);
    speak('OSCE telah selesai');
}

function tick(){
    remaining--;
    if(!freezeMode){
        const elapsed = ROTATION_TIME - remaining;
        if(elapsed === 60){ speak('Silakan membaca soal'); }
        if(elapsed === 780){ speak('Waktu tersisa satu menit'); }
        if(elapsed === 840){ speak('Silakan pindah stase berikutnya'); }
    } else {
        if(remaining === 60){ speak('Penguji dipersilakan kembali ke ruangan'); }
    }
    if(remaining <= 0){
        nextStage();
    }
    updateDisplay();
}

function toggleTimer(){
    if(running){
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer(){
    if(running) return;
    running = true;
    interval = setInterval(tick, 1000);
    if(!isContinued){
        speak('Peserta dipersilakan membaca soal');
    }
    startBtnEl.textContent = 'Jeda';
}

function pauseTimer(){
    if(!running) return;
    running = false;
    clearInterval(interval);
    isContinued = true;
    startBtnEl.textContent = 'Lanjutkan';
}

function resetTimer(){
    clearInterval(interval);
    running = false;
    rotation = 1;
    remaining = ROTATION_TIME;
    freezeMode = false;
    isContinued = false;
    startBtnEl.textContent = 'Mulai';
    setRotation(1);
    syncRotationButtons();
    updateDisplay();
}

function goFullscreen(){
    if(!document.fullscreenElement){
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen();
    }
}

function goRotation(rot){
    clearInterval(interval);
    running = false;
    rotation = rot;
    freezeMode = false;
    remaining = ROTATION_TIME;
    isContinued = false;
    startBtnEl.textContent = 'Mulai';
    setRotation(rotation);
    syncRotationButtons();
    updateDisplay();
    speak('Rotasi ' + rotation + ' dipilih');
}

function skipPhase(){
    isContinued = false;
    if(freezeMode){
        nextStage();
        return;
    }
    const elapsed = ROTATION_TIME - remaining;
    if(elapsed < 60){
        remaining = 840;
        updateDisplay();
        speak('silakan masuk');
        return;
    }
    if(elapsed < 780){
        remaining = 120;
        updateDisplay();
        speak('Waktu tersisa satu menit');
        return;
    }
    if(elapsed < 840){
        remaining = 60;
        updateDisplay();
        speak('Silakan pindah stase berikutnya');
        return;
    }
    nextStage();
}

updateDisplay();
syncRotationButtons();

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', function(e){
    if(e.key === 'F12' ||
       (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
       (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'c'))){
        e.preventDefault();
    }
});
