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

let audioPlayer = null;
let audioQueue = [];
let audioToken = 0;

function stopAudio(){
    audioToken++;
    audioQueue = [];
    if(audioPlayer){
        audioPlayer.onended = null;
        audioPlayer.onerror = null;
        audioPlayer.pause();
    }
}

function playNext(token){
    if(token !== audioToken) return;
    const name = audioQueue[0];
    if(!name) return;

    if(!audioPlayer){
        audioPlayer = new Audio();
        audioPlayer.preload = 'auto';
    }

    const advance = () => {
        if(token !== audioToken || audioQueue[0] !== name) return;
        audioQueue.shift();
        playNext(token);
    };
    audioPlayer.onended = advance;
    audioPlayer.onerror = advance;
    audioPlayer.src = 'audio/' + name + '.mp3';

    let tries = 0;
    const start = () => {
        if(token !== audioToken || audioQueue[0] !== name) return;
        const pending = audioPlayer.play();
        if(!pending) return;
        pending.catch(() => {
            if(token !== audioToken || audioQueue[0] !== name) return;
            if(tries++ < 2){
                setTimeout(start, 100);
            } else {
                advance();
            }
        });
    };
    start();
}

function playAudio(names){
    stopAudio();
    audioQueue = names.map(String);
    playNext(audioToken);
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
    playAudio(['ROTASI', rotation, 'DIMULAI', 'Silahkan membaca soal']);
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
        playAudio(['Freeze dimulai']);
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
    playAudio(['OSCE selesai']);
}

function tick(){
    remaining--;
    if(!freezeMode){
        const elapsed = ROTATION_TIME - remaining;
        if(elapsed === 60){ playAudio(['Silahkan masuk']); }
        if(elapsed === 780){ playAudio(['Waktu tersisa satu menit']); }
        if(elapsed === 840){ playAudio(['Silahkan pindah ke stase beriutnya']); }
    } else {
        if(remaining === 60){ playAudio(['Penguji dipersilahkan kembali']); }
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
        if(rotation === 1){
            playAudio(['OSCE', 'DIMULAI', 'Peserta dipersilahkan membaca soal']);
        } else {
            playAudio(['ROTASI', rotation, 'DIMULAI', 'Silahkan membaca soal']);
        }
    }
    startBtnEl.textContent = 'Jeda';
}

function pauseTimer(){
    if(!running) return;
    running = false;
    clearInterval(interval);
    isContinued = true;
    stopAudio();
    startBtnEl.textContent = 'Lanjutkan';
}

function resetTimer(){
    clearInterval(interval);
    stopAudio();
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
    playAudio(['ROTASI', rotation, 'DIPILIH']);
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
        playAudio(['Silahkan masuk']);
        return;
    }
    if(elapsed < 780){
        remaining = 120;
        updateDisplay();
        playAudio(['Waktu tersisa satu menit']);
        return;
    }
    if(elapsed < 840){
        remaining = 60;
        updateDisplay();
        playAudio(['Silahkan pindah ke stase beriutnya']);
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
