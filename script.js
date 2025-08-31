document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const follower = document.querySelector(".follower");
    const target = document.querySelector(".target");
    const body = document.body;
    const nameModal = document.getElementById("nameModal");
    const nameInput = document.getElementById("nameInput");
    const submitNameBtn = document.getElementById("submitNameBtn");
    const userNameDisplay = document.getElementById("userNameDisplay");
    
    // Controls
    const controls = {
        f: { slider: document.getElementById("fSlider"), input: document.getElementById("fInput") },
        z: { slider: document.getElementById("zSlider"), input: document.getElementById("zInput") },
        r: { slider: document.getElementById("rSlider"), input: document.getElementById("rInput") },
        sides: { slider: document.getElementById("sidesSlider"), input: document.getElementById("sidesInput") }
    };
    const themeToggle = document.getElementById("themeToggle");
    const followerColorPicker = document.getElementById("followerColor");
    const trailColorPicker = document.getElementById("trailColor");

    let mousePos = new Vector2();
    const dynamics = new SecondOrderDynamics(2.5, 0.65, 1.0, new Vector2());
    
    // --- Initialization ---
    
    function init() {
        // Name Modal Logic
        const savedName = localStorage.getItem("userName");
        if (savedName) {
            userNameDisplay.textContent = savedName;
        } else {
            nameModal.classList.add("visible");
        }

        submitNameBtn.addEventListener("click", handleNameSubmit);
        nameInput.addEventListener("keyup", (e) => {
            if (e.key === "Enter") handleNameSubmit();
        });

        // Theme Logic
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
            body.classList.add("dark-mode");
            themeToggle.checked = true;
        }
        themeToggle.addEventListener('change', handleThemeToggle);

        // Control Listeners
        Object.keys(controls).forEach(param => {
            const isShapeControl = param === 'sides';
            controls[param].slider.addEventListener("input", (e) => {
                syncInputs(param, e.target.value);
                isShapeControl ? updateShape() : updateDynamics();
            });
            controls[param].input.addEventListener("input", (e) => {
                syncInputs(param, e.target.value);
                isShapeControl ? updateShape() : updateDynamics();
            });
        });

        followerColorPicker.addEventListener('input', (e) => follower.style.backgroundColor = e.target.value);
        trailColorPicker.addEventListener('input', (e) => target.style.backgroundColor = e.target.value);

        // Mouse Listener
        document.addEventListener("mousemove", (e) => {
            mousePos = new Vector2(e.clientX, e.clientY);
            target.style.left = `${mousePos.x}px`;
            target.style.top = `${mousePos.y}px`;
        });
        
        // Initial state updates
        updateShape();
        updateDynamics();
        follower.style.backgroundColor = followerColorPicker.value;
        target.style.backgroundColor = trailColorPicker.value; // Also color the target dot
        
        // Start animation loop
        requestAnimationFrame(animate);
    }

    // --- Event Handlers ---

    function handleNameSubmit() {
        const name = nameInput.value.trim();
        if (name) {
            userNameDisplay.textContent = name;
            localStorage.setItem("userName", name);
            nameModal.classList.remove("visible");
        }
    }

    function handleThemeToggle() {
        body.classList.toggle('dark-mode', themeToggle.checked);
        localStorage.setItem("theme", themeToggle.checked ? "dark" : "light");
    }

    // --- Core Logic ---

    function syncInputs(param, value) {
        const isNonNegative = ['f', 'z', 'sides'].includes(param);
        const finalValue = isNonNegative ? Math.max(0, value) : value;
        controls[param].slider.value = finalValue;
        controls[param].input.value = finalValue;
    }

    function updateDynamics() {
        const f = parseFloat(controls.f.input.value) || 0;
        const z = parseFloat(controls.z.input.value) || 0;
        const r = parseFloat(controls.r.input.value) || 0;
        dynamics.updateConstants(Math.max(0, f), Math.max(0, z), r);
    }

    function updateShape() {
        const sides = parseInt(controls.sides.input.value, 10);
        follower.style.borderRadius = '0'; // Reset border radius
        
        if (sides === 0) { // Circle
            follower.style.borderRadius = '50%';
            follower.style.clipPath = 'none';
        } else if (sides > 0 && sides < 3) { // Dot (1) or Line (2)
            follower.style.clipPath = 'polygon(0% 48%, 100% 48%, 100% 52%, 0% 52%)';
        } else { // Polygons
            const points = [];
            const angleStep = (Math.PI * 2) / sides;
            const rotationOffset = sides % 2 === 0 ? angleStep / 2 : -Math.PI / 2;
            for (let i = 0; i < sides; i++) {
                const angle = i * angleStep + rotationOffset;
                const x = 50 + 50 * Math.cos(angle);
                const y = 50 + 50 * Math.sin(angle);
                points.push(`${x.toFixed(3)}% ${y.toFixed(3)}%`);
            }
            follower.style.clipPath = `polygon(${points.join(', ')})`;
        }
    }

    function createTrail(x, y) {
        const particle = document.createElement('div');
        particle.className = 'trail-particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = '15px';
        particle.style.height = '15px';
        particle.style.backgroundColor = trailColorPicker.value;
        body.appendChild(particle);
        setTimeout(() => particle.remove(), 500); // Remove after animation ends
    }

    // --- Animation Loop ---

    let lastTime = performance.now();
    let trailCounter = 0;
    function animate(currentTime) {
        const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
        lastTime = currentTime;
        
        const newPos = dynamics.update(deltaTime, mousePos);
        follower.style.left = `${newPos.x}px`;
        follower.style.top = `${newPos.y}px`;

        // Create a trail particle every few frames to avoid too many elements
        if (++trailCounter % 2 === 0) {
            createTrail(newPos.x, newPos.y);
        }
        
        requestAnimationFrame(animate);
    }

    // Start everything
    init();
});
