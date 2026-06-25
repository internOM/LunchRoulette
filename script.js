const optionsList = document.getElementById('optionsList');
const optionInput = document.getElementById('optionInput');
const addBtn = document.getElementById('addBtn');
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const leverHandle = document.getElementById('leverHandle');
const resultModal = document.getElementById('resultModal');
const winnerName = document.getElementById('winnerName');
const closeModal = document.getElementById('closeModal');
const centerSpinBtn = document.getElementById('centerSpinBtn');

let options = [
    "Blk 6",
    "KouFu",
    "Blk 301",
    "Blk 302 (LuoHanYu)",
    "Blk 302 (WenHua)",
    "CheapCaiFan"
];

// Colors matching the screenshot (Teal, Gold, Red, Navy, Orange, Purple)
const colors = ["#2e9e80", "#efcd51", "#b63c32", "#2d3e50", "#e1862b", "#8b489d"];

let currentRotation = 0;
let isSpinning = false;

// Render options list
function renderList() {
    optionsList.innerHTML = '';
    options.forEach((option, index) => {
        const li = document.createElement('li');
        li.textContent = option;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => {
            options.splice(index, 1);
            renderList();
            drawWheel();
        };

        li.appendChild(deleteBtn);
        optionsList.appendChild(li);
    });
}

// Add new option
addBtn.addEventListener('click', () => {
    const newOption = optionInput.value.trim();
    if (newOption) {
        options.push(newOption);
        optionInput.value = '';
        renderList();
        drawWheel();
    }
});

optionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addBtn.click();
});

// Draw wheel
function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 15;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (options.length === 0) return;

    const arc = Math.PI * 2 / options.length;

    // Pass 1: Draw all segment fills
    options.forEach((option, i) => {
        const angle = currentRotation + i * arc;
        ctx.beginPath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + arc);
        ctx.fill();
    });

    // Pass 2: Draw all segment borders on top (so no fill covers them)
    options.forEach((option, i) => {
        const angle = currentRotation + i * arc;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + arc);
        ctx.closePath();
        ctx.strokeStyle = "#1a0f14";
        ctx.lineWidth = 4;
        ctx.stroke();
    });

    // Pass 3: Draw all text labels
    options.forEach((option, i) => {
        const angle = currentRotation + i * arc;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fdfefe';
        ctx.font = 'bold 32px Roboto, sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        let lines = [];
        if (option.length > 10 && option.includes(' ')) {
            let words = option.split(' ');
            let mid = Math.ceil(words.length / 2);
            if (words.length > 2 && words[0].length <= 3) {
                mid = Math.max(mid, 2);
            }
            lines.push(words.slice(0, mid).join(' '));
            lines.push(words.slice(mid).join(' '));
        } else {
            lines.push(option);
        }

        if (lines.length === 1) {
            ctx.fillText(lines[0], radius - 55, 0);
        } else {
            ctx.fillText(lines[0], radius - 55, -20);
            ctx.fillText(lines[1], radius - 55, 20);
        }
        ctx.restore();
    });

    // Draw outer rim and pegs
    const rimRadius = radius - 15;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rimRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 4;
    ctx.stroke();

    for (let i = 0; i < 30; i++) {
        const pegAngle = (Math.PI * 2 / 30) * i;
        ctx.beginPath();
        ctx.arc(
            centerX + Math.cos(pegAngle) * rimRadius,
            centerY + Math.sin(pegAngle) * rimRadius,
            4, 0, Math.PI * 2
        );
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// Spin logic
function spinWheel() {
    if (isSpinning || options.length === 0) return;
    isSpinning = true;

    // Play mechanical sound if you had one, for now just visuals
    const spinAngle = Math.random() * Math.PI * 10 + Math.PI * 20; // 10 to 15 full rotations
    const duration = 6000; // 6 seconds
    const start = performance.now();
    const initialRotation = currentRotation;

    function animate(time) {
        let elapsed = time - start;
        if (elapsed > duration) elapsed = duration;

        // easeOutCirc to make it feel like a heavy mechanical wheel slowing down
        const progress = Math.sqrt(1 - Math.pow(elapsed / duration - 1, 2));
        currentRotation = initialRotation + progress * spinAngle;

        drawWheel();

        if (elapsed < duration) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            determineWinner();
        }
    }

    requestAnimationFrame(animate);
}

// Determine winner
function determineWinner() {
    const normalizedRotation = currentRotation % (Math.PI * 2);
    // Arrow is at the top (which is -PI/2 in canvas coordinates, or 1.5 PI)
    const arrowAngle = Math.PI * 1.5;
    const arc = Math.PI * 2 / options.length;

    let winningAngle = (arrowAngle - normalizedRotation) % (Math.PI * 2);
    if (winningAngle < 0) winningAngle += Math.PI * 2;

    const winningIndex = Math.floor(winningAngle / arc);
    const winner = options[winningIndex];

    winnerName.textContent = winner;
    resultModal.classList.add('active');
}

closeModal.addEventListener('click', () => {
    resultModal.classList.remove('active');
});

// Lever Interaction
let startY = 0;
let isDragging = false;
let startTime = 0;

function onLeverStart(e) {
    if (isSpinning) return;
    isDragging = true;
    startY = e.clientY || (e.touches && e.touches[0].clientY);
    startTime = Date.now();

    // Disable CSS transition during drag
    leverHandle.style.transition = 'none';
}

function onLeverMove(e) {
    if (!isDragging) return;
    let clientY = e.clientY || (e.touches && e.touches[0].clientY);
    let dy = clientY - startY;

    if (dy < 0) dy = 0;
    // Lever slot is 350px, handle is 70px. Max distance is 350 - 70 = 280px
    if (dy > 280) dy = 280;

    leverHandle.style.transform = `translateX(-50%) translateY(${dy}px)`;
}

function onLeverEnd(e) {
    if (!isDragging) return;
    isDragging = false;

    // Read the current transform distance
    const transformStr = leverHandle.style.transform;
    let pulledDistance = 0;
    const match = transformStr.match(/translateY\(([-\d.]+)px\)/);
    if (match) {
        pulledDistance = parseFloat(match[1]);
    }

    const timeElapsed = Date.now() - startTime;

    // Tap to spin: very short drag and quick release
    if (pulledDistance < 15 && timeElapsed < 400) {
        // Animate lever pulling down automatically
        leverHandle.style.transition = 'transform 0.2s ease-in';
        leverHandle.style.transform = `translateX(-50%) translateY(180px)`;

        setTimeout(() => {
            // Snap back
            leverHandle.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            leverHandle.style.transform = `translateX(-50%) translateY(0px)`;

            setTimeout(() => {
                leverHandle.style.transition = '';
            }, 400);

            spinWheel();
        }, 200);
        return;
    }

    // Snap back for normal drag
    leverHandle.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    leverHandle.style.transform = `translateX(-50%) translateY(0px)`;

    setTimeout(() => {
        leverHandle.style.transition = '';
    }, 400);

    // Trigger spin if pulled at least 100px
    if (pulledDistance > 100) {
        spinWheel();
    }
}

// Mouse events
leverHandle.addEventListener('mousedown', onLeverStart);
document.addEventListener('mousemove', onLeverMove);
document.addEventListener('mouseup', onLeverEnd);

// Touch events for mobile
leverHandle.addEventListener('touchstart', onLeverStart, { passive: true });
document.addEventListener('touchmove', onLeverMove, { passive: true });
document.addEventListener('touchend', onLeverEnd);

// Handle window resize for canvas scaling (optional, but CSS flex handles visual scaling)
// We just re-draw when resizing to ensure sharpness, though canvas scales automatically.
window.addEventListener('resize', drawWheel);

// Center Spin Button Interaction
centerSpinBtn.addEventListener('click', () => {
    if (isSpinning || options.length === 0) return;

    // Animate the lever down and up for visual effect
    leverHandle.style.transition = 'transform 0.2s ease-in';
    leverHandle.style.transform = `translateX(-50%) translateY(180px)`;

    setTimeout(() => {
        leverHandle.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        leverHandle.style.transform = `translateX(-50%) translateY(0px)`;

        setTimeout(() => {
            leverHandle.style.transition = '';
        }, 400);
    }, 200);

    spinWheel();
});

// Init
renderList();
drawWheel();

