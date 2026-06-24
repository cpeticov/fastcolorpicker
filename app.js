// Elementos capturados do HTML
const btn = document.getElementById('actionBtn');
const fileInput = document.getElementById('image-fallback');
const preview = document.getElementById('previewBg');
const slideR = document.getElementById('slideR');
const slideG = document.getElementById('slideG');
const slideB = document.getElementById('slideB');
const historyList = document.getElementById('historyList');

// Carrega o histórico salvo do navegador ou começa vazio (máximo 8 cores)
let colorHistory = JSON.parse(localStorage.getItem('colorHistory')) || [];

const pantonePalette = [
    { name: 'PMS 186 C', r: 200, g: 16, b: 46 },
    { name: 'PMS 2192 C', r: 59, g: 130, b: 246 },
    { name: 'PMS 354 C', r: 0, g: 177, b: 64 },
    { name: 'PMS Process Black', r: 39, g: 37, b: 31 }
];

// Inicializa a tela carregando o histórico salvo anteriormente
renderHistory();

if (window.EyeDropper) {
    btn.textContent = "🔍 Pick Color from Screen"; 
    btn.addEventListener('click', async () => {
        const eyeDropper = new EyeDropper();
        try {
            const result = await eyeDropper.open();
            updateFromHex(result.sRGBHex);
            
            // Salva no histórico e copia
            addToHistory(result.sRGBHex.toUpperCase());
            navigator.clipboard.writeText(result.sRGBHex.toUpperCase());
            
            triggerToast('valHex');
        } catch (e) { console.log("Selection canceled"); }
    });
} else {
    btn.textContent = "📸 Upload Image or Photo";
    btn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 1; canvas.height = 1;
                ctx.drawImage(img, img.width/2, img.height/2, 1, 1, 0, 0, 1, 1);
                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                slideR.value = r; slideG.value = g; slideB.value = b;
                updateColors();
                addToHistory(rgbToHex(r, g, b));
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(file);
    });
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("").toUpperCase();
}

function rgbToCmyk(r, g, b) {
    let c = 1 - (r / 255); let m = 1 - (g / 255); let y = 1 - (b / 255);
    let k = Math.min(c, Math.min(m, y));
    if (k === 1) return "cmyk(0%, 0%, 0%, 100%)";
    c = Math.round(((c - k) / (1 - k)) * 100);
    m = Math.round(((m - k) / (1 - k)) * 100);
    y = Math.round(((y - k) / (1 - k)) * 100);
    k = Math.round(k * 100);
    return `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;
}

function getClosestPantone(r, g, b) {
    let closest = pantonePalette[0]; let minDistance = Infinity;
    pantonePalette.forEach(p => {
        let distance = Math.sqrt(Math.pow(r - p.r, 2) + Math.pow(g - p.g, 2) + Math.pow(b - p.b, 2));
        if (distance < minDistance) { minDistance = distance; closest = p; }
    });
    return closest.name;
}

function updateFromHex(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    slideR.value = r; slideG.value = g; slideB.value = b;
    updateColors();
}

function updateColors() {
    const r = slideR.value; const g = slideG.value; const b = slideB.value;
    const hex = rgbToHex(r, g, b);
    document.documentElement.style.setProperty('--selected-color', hex);
    document.getElementById('valHex').textContent = hex;
    document.getElementById('valRgb').textContent = `rgb(${r}, ${g}, ${b})`;
    document.getElementById('valCmyk').textContent = rgbToCmyk(r, g, b);
    document.getElementById('valPantone').textContent = getClosestPantone(r, g, b);
}

// Escuta os Sliders em tempo real para a cor de fundo
[slideR, slideG, slideB].forEach(slider => {
    slider.addEventListener('input', updateColors);
    // GATILHO INTELIGENTE: Só joga no histórico quando o usuário solta o mouse/dedo
    slider.addEventListener('change', () => {
        const hex = rgbToHex(slideR.value, slideG.value, slideB.value);
        addToHistory(hex);
    });
});

// GERENCIAMENTO DO HISTÓRICO
function addToHistory(hex) {
    // Evita duplicados seguidos
    if (colorHistory[0] === hex) return;
    // Adiciona no início da lista
    colorHistory.unshift(hex);
    // Limita em 8 cores na tela para manter o minimalismo
    if (colorHistory.length > 8) colorHistory.pop();
    // Salva no navegador do usuário
    localStorage.setItem('colorHistory', JSON.stringify(colorHistory));
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = '';
    colorHistory.forEach(hex => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.style.backgroundColor = hex;
        item.title = `Click to apply & copy: ${hex}`;
        
        // Um clique: Aplica a cor na tela e já joga o HEX no clipboard
        item.addEventListener('click', () => {
            updateFromHex(hex);
            navigator.clipboard.writeText(hex);
            triggerToast('valHex');
        });
        historyList.appendChild(item);
    });
}

function clearHistory() {
    colorHistory = [];
    localStorage.removeItem('colorHistory');
    renderHistory();
}

function triggerToast(id) {
    const row = document.getElementById(id).closest('.format-row');
    const toast = row.querySelector('.toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1200);
}

function copyText(element) {
    const textToCopy = element.querySelector('.format-value').textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
        const toast = element.querySelector('.toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1200);
    });
}
