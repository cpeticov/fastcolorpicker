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

// Banco de dados expandido com as principais cores Pantone (PMS) do mercado real
const pantonePalette = [
    // VERMELHOS E ROSAS
    { name: 'PMS 186 C (Bright Red)', r: 200, g: 16, b: 46 },
    { name: 'PMS 199 C (Ruby Red)', r: 213, g: 0, b: 50 },
    { name: 'PMS 226 C (Magenta/Pink)', r: 213, g: 0, b: 121 },
    { name: 'PMS 1788 C (Warm Red)', r: 249, g: 56, b: 34 },

    // LARANJAS
    { name: 'PMS 021 C (Pure Orange)', r: 255, g: 108, b: 0 },
    { name: 'PMS 151 C (Tiger Orange)', r: 255, g: 130, b: 0 },
    { name: 'PMS 165 C (Coral Orange)', r: 255, g: 103, b: 31 },

    // AMARELOS
    { name: 'PMS Yellow C (Process Yellow)', r: 254, g: 221, b: 0 },
    { name: 'PMS 116 C (Golden Yellow)', r: 255, g: 205, b: 0 },
    { name: 'PMS 123 C (Warm Yellow)', r: 255, g: 199, b: 44 },

    // ROXOS E VIOLETAS
    { name: 'PMS Violet C (Deep Violet)', r: 67, g: 0, b: 151 },
    { name: 'PMS 266 C (Royal Purple)', r: 127, g: 31, b: 223 },
    { name: 'PMS 252 C (Bright Orchid)', r: 218, g: 58, b: 219 },

    // AZUIS
    { name: 'PMS 2192 C (Vibrant Blue)', r: 59, g: 130, b: 246 },
    { name: 'PMS Reflex Blue C', r: 10, g: 22, b: 150 },
    { name: 'PMS Process Blue C', r: 0, g: 133, b: 202 },
    { name: 'PMS 293 C (Classic Blue)', r: 0, g: 61, b: 165 },
    { name: 'PMS 300 C (Ocean Blue)', r: 0, g: 94, b: 184 },

    // VERDES
    { name: 'PMS 354 C (Bright Green)', r: 0, g: 177, b: 64 },
    { name: 'PMS Green C (Process Green)', r: 0, g: 166, b: 80 },
    { name: 'PMS 368 C (Lime Green)', r: 120, g: 190, b: 32 },
    { name: 'PMS 320 C (Teal/Turquoise)', r: 0, g: 156, b: 166 },

    // MARRONS E DIAS DE OUTONO
    { name: 'PMS 469 C (Chocolate Brown)', r: 96, g: 58, b: 43 },
    { name: 'PMS 168 C (Dark Ochre)', r: 114, g: 61, b: 34 },

    // NEUTROS, ACINZENTADOS E PRETOS
    { name: 'PMS Process Black C', r: 39, g: 37, b: 31 },
    { name: 'PMS Cool Gray 1 C (Light Gray)', r: 217, g: 217, b: 214 },
    { name: 'PMS Cool Gray 7 C (Medium Gray)', r: 151, g: 153, b: 155 },
    { name: 'PMS Cool Gray 11 C (Dark Charcoal)', r: 83, g: 86, b: 90 }
];

// Inicializa a tela carregando o histórico salvo anteriormente
renderHistory();

// 1. Detecta se o dispositivo é genuinamente um celular/tablet pelo tamanho da tela ou toque
const isMobile = window.matchMedia("(max-width: 768px)").matches || ('ontouchstart' in window);

if (isMobile) {
    // ---- FLUXO EXCLUSIVO PARA CELULARES ----
    btn.textContent = "📸 Upload Image or Photo";
    const imgPreview = document.getElementById('user-image-preview');
    
    btn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            imgPreview.src = event.target.result;
            imgPreview.style.display = 'block';
            btn.textContent = "👆 Tap anywhere on the image";
            btn.style.background = "rgba(0,0,0,0.6)";
        }
        reader.readAsDataURL(file);
    });

    imgPreview.addEventListener('click', function(e) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // 1. Obtém as dimensões do elemento <img> na tela
            const rect = imgPreview.getBoundingClientRect();
            
            // 2. Calcula as proporções de escala entre a imagem real e o elemento na tela
            const imgRatio = img.width / img.height;
            const containerRatio = rect.width / rect.height;
            
            let actualWidth, actualHeight, offsetX, offsetY;
            
            // 3. Descobre o tamanho real que a imagem ocupa na tela (descontando as barras de espaço)
            if (imgRatio > containerRatio) {
                // Imagem é mais larga (barras pretas/invisíveis no topo e fundo)
                actualWidth = rect.width;
                actualHeight = rect.width / imgRatio;
                offsetX = 0;
                offsetY = (rect.height - actualHeight) / 2;
            } else {
                // Imagem é mais alta (barras pretas/invisíveis nas laterais)
                actualWidth = rect.height * imgRatio;
                actualHeight = rect.height;
                offsetX = (rect.width - actualWidth) / 2;
                offsetY = 0;
            }
            
            // 4. Calcula a posição exata do clique em relação apenas à área da imagem
            const clickX = e.clientX - rect.left - offsetX;
            const clickY = e.clientY - rect.top - offsetY;
            
            // 5. Garante que o clique não estoure os limites da imagem caso o usuário clique na borda externa
            if (clickX >= 0 && clickX <= actualWidth && clickY >= 0 && clickY <= actualHeight) {
                // Converte a coordenada da tela para a coordenada real de pixels da imagem original
                const x = (clickX / actualWidth) * img.width;
                const y = (clickY / actualHeight) * img.height;
                
                // Captura o pixel cirúrgico
                const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
                
                slideR.value = r; slideG.value = g; slideB.value = b;
                updateColors();
                
                const currentHex = rgbToHex(r, g, b);
                addToHistory(currentHex);
                navigator.clipboard.writeText(currentHex);
                triggerToast('valHex');
            }
        };
        img.src = imgPreview.src;
    });

} else {
    // ---- FLUXO PARA COMPUTADORES (DESKTOP) ----
    
    // Caso 1: Computador com suporte ao Conta-Gotas nativo (Chrome, Edge, Opera)
    if (window.EyeDropper) {
        btn.textContent = "Pick Color from Screen";
        btn.addEventListener('click', async () => {
            try {
                const eyeDropper = new EyeDropper();
                const result = await eyeDropper.open();
                const hex = result.sRGBHex;
                
                // Converte HEX para RGB para atualizar os sliders do seu site
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                
                slideR.value = r; slideG.value = g; slideB.value = b;
                updateColors();
                
                addToHistory(hex);
                navigator.clipboard.writeText(hex);
                triggerToast('valHex');
            } catch (err) {
                console.log("Selection canceled or failed");
            }
        });
    } 
    // Caso 2: Computador SEM suporte ao Conta-Gotas nativo (Firefox, Zen Browser)
    else {
        btn.textContent = "🖼️ Drop or Upload Image to Pick Color";
        const imgPreview = document.getElementById('user-image-preview');
        
        btn.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            // TRAVAS DE SEGURANÇA: Impede o Firefox/Zen de abrir a imagem em uma nova aba
            e.preventDefault();
            e.stopPropagation();
            
            const file = e.target.files[0]; // Força a leitura do primeiro arquivo explicitamente
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                imgPreview.src = event.target.result;
                imgPreview.style.display = 'block';
                btn.textContent = "🎯 Click anywhere on the image below";
                btn.style.background = "rgba(0,0,0,0.7)";
            }
            reader.readAsDataURL(file);
        });

        imgPreview.addEventListener('click', function(e) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // 1. Obtém as dimensões do elemento <img> na tela
                const rect = imgPreview.getBoundingClientRect();
                
                // 2. Calcula as proporções de escala entre a imagem real e o elemento na tela
                const imgRatio = img.width / img.height;
                const containerRatio = rect.width / rect.height;
                
                let actualWidth, actualHeight, offsetX, offsetY;
                
                // 3. Descobre o tamanho real que a imagem ocupa na tela (descontando as barras de espaço)
                if (imgRatio > containerRatio) {
                    // Imagem é mais larga (barras pretas/invisíveis no topo e fundo)
                    actualWidth = rect.width;
                    actualHeight = rect.width / imgRatio;
                    offsetX = 0;
                    offsetY = (rect.height - actualHeight) / 2;
                } else {
                    // Imagem é mais alta (barras pretas/invisíveis nas laterais)
                    actualWidth = rect.height * imgRatio;
                    actualHeight = rect.height;
                    offsetX = (rect.width - actualWidth) / 2;
                    offsetY = 0;
                }
                
                // 4. Calcula a posição exata do clique em relação apenas à área da imagem
                const clickX = e.clientX - rect.left - offsetX;
                const clickY = e.clientY - rect.top - offsetY;
                
                // 5. Garante que o clique não estoure os limites da imagem caso o usuário clique na borda externa
                if (clickX >= 0 && clickX <= actualWidth && clickY >= 0 && clickY <= actualHeight) {
                    // Converte a coordenada da tela para a coordenada real de pixels da imagem original
                    const x = (clickX / actualWidth) * img.width;
                    const y = (clickY / actualHeight) * img.height;
                    
                    // Captura o pixel cirúrgico
                    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
                    
                    slideR.value = r; slideG.value = g; slideB.value = b;
                    updateColors();
                    
                    const currentHex = rgbToHex(r, g, b);
                    addToHistory(currentHex);
                    navigator.clipboard.writeText(currentHex);
                    triggerToast('valHex');
                }
            };
            img.src = imgPreview.src;
        });

    }
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

// Função para abrir/fechar o modal de políticas de privacidade
function togglePrivacy(event) {
    event.preventDefault();
    const modal = document.getElementById('privacyModal');
    modal.classList.toggle('active');
}

    // Função para abrir/fechar o modal de Termos de Uso
    function toggleTerms(event) {
        event.preventDefault();
        const modal = document.getElementById('termsModal');
        modal.classList.toggle('active');
    }

    // Função para abrir/fechar o modal de Contato
    function toggleContact(event) {
        event.preventDefault();
        const modal = document.getElementById('contactModal');
        modal.classList.toggle('active');
    }