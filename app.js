// Elementos capturados do HTML
const btn = document.getElementById('actionBtn');
const fileInput = document.getElementById('image-fallback');
const preview = document.getElementById('previewBg');
const slideR = document.getElementById('slideR');
const slideG = document.getElementById('slideG');
const slideB = document.getElementById('slideB');

// Amostra reduzida de cores Pantone para simular o algoritmo de aproximação
const pantonePalette = [
    { name: 'PMS 186 C', r: 200, g: 16, b: 46 },
    { name: 'PMS 2192 C', r: 59, g: 130, b: 246 },
    { name: 'PMS 354 C', r: 0, g: 177, b: 64 },
    { name: 'PMS Process Black', r: 39, g: 37, b: 31 }
];

// 1. Inteligência de Dispositivo (Conta-gotas no PC vs Câmera no Mobile)
if (window.EyeDropper) {
    btn.textContent = "🔍 Pick Color from Screen";
    btn.addEventListener('click', async () => {
        const eyeDropper = new EyeDropper();
        try {
            const result = await eyeDropper.open();
            updateFromHex(result.sRGBHex);
            
            // NOVO: Copia automaticamente o HEX assim que o usuário escolhe a cor na lupa
            navigator.clipboard.writeText(result.sRGBHex.toUpperCase());
            
            // NOVO: Feedback visual na linha do HEX para avisar que foi copiado
            const hexRow = document.getElementById('valHex').closest('.format-row');
            const toast = hexRow.querySelector('.toast');
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 1200);

        } catch (e) { console.log("Seleção cancelada"); }
    });
} else {
    btn.textContent = "📸 Enviar Foto/Imagem";
    btn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files;
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
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(file);
    });
}

// 2. Funções Matemáticas de Conversão (Client-Side Puro)
function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("").toUpperCase();
}

function rgbToCmyk(r, g, b) {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, Math.min(m, y));
    if (k === 1) return "cmyk(0%, 0%, 0%, 100%)";
    c = Math.round(((c - k) / (1 - k)) * 100);
    m = Math.round(((m - k) / (1 - k)) * 100);
    y = Math.round(((y - k) / (1 - k)) * 100);
    k = Math.round(k * 100);
    return `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;
}

// Calcula a menor distância geométrica entre a cor atual e a tabela Pantone
function getClosestPantone(r, g, b) {
    let closest = pantonePalette;
    let minDistance = Infinity;
    pantonePalette.forEach(p => {
        let distance = Math.sqrt(
            Math.pow(r - p.r, 2) + Math.pow(g - p.g, 2) + Math.pow(b - p.b, 2)
        );
        if (distance < minDistance) {
            minDistance = distance;
            closest = p;
        }
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

// 3. Atualização de Interface em Tempo Real
function updateColors() {
    const r = slideR.value;
    const g = slideG.value;
    const b = slideB.value;
    
    const hex = rgbToHex(r, g, b);
    const cmyk = rgbToCmyk(r, g, b);
    const pantone = getClosestPantone(r, g, b);

    document.documentElement.style.setProperty('--selected-color', hex);
    document.getElementById('valHex').textContent = hex;
    document.getElementById('valRgb').textContent = `rgb(${r}, ${g}, ${b})`;
    document.getElementById('valCmyk').textContent = cmyk;
    document.getElementById('valPantone').textContent = pantone;
}

// Escuta os Sliders (input funciona de forma contínua no touch enquanto arrasta)
[slideR, slideG, slideB].forEach(slider => {
    slider.addEventListener('input', updateColors);
});

// 4. Mecanismo de Cópia "One Click" com Feedback Visual rápido
function copyText(element) {
    const textToCopy = element.querySelector('.format-value').textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
        const toast = element.querySelector('.toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1200);
    });
}
