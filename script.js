document.addEventListener("DOMContentLoaded", () => {
  const follower = document.querySelector(".follower");
  const target = document.querySelector(".target");
  const body = document.body;

  const controls = {
      f: { slider: document.getElementById("fSlider"), input: document.getElementById("fInput") },
      z: { slider: document.getElementById("zSlider"), input: document.getElementById("zInput") },
      r: { slider: document.getElementById("rSlider"), input: document.getElementById("rInput") },
      sides: { slider: document.getElementById("sidesSlider"), input: document.getElementById("sidesInput") }
  };
  const themeToggle = document.getElementById("themeToggle");

  let mousePos = new Vector2();
  const dynamics = new SecondOrderDynamics(2.5, 0.65, 1.0, new Vector2());

  function clampNonNegative(value) {
      return Math.max(0, value);
  }

  function syncInputs(param, value) {
      const nonNegativeParams = ['f', 'z', 'sides'];
      const finalValue = nonNegativeParams.includes(param) ? clampNonNegative(value) : value;
      controls[param].slider.value = finalValue;
      controls[param].input.value = finalValue;
  }

  function updateDynamics() {
      const f = clampNonNegative(parseFloat(controls.f.input.value) || 0);
      const z = clampNonNegative(parseFloat(controls.z.input.value) || 0);
      const r = parseFloat(controls.r.input.value) || 0;
      dynamics.updateConstants(f, z, r);
  }

  function updateShape() {
      const sides = parseInt(controls.sides.input.value, 10);
      
      follower.style.borderRadius = '0';
      follower.style.clipPath = 'none';
      follower.style.width = '40px';
      follower.style.height = '40px';

      if (sides === 0) { // Circle
          follower.style.borderRadius = '50%';
      } else if (sides === 1) { // Dot
          follower.style.width = '8px';
          follower.style.height = '8px';
          follower.style.borderRadius = '50%';
      } else if (sides === 2) { // Line
          follower.style.clipPath = 'polygon(0% 48%, 100% 48%, 100% 52%, 0% 52%)';
      } else if (sides >= 3) { // Polygons
          const points = [];
          const angleStep = (Math.PI * 2) / sides;
          const rotationOffset = sides % 2 === 0 ? angleStep / 2 : -Math.PI / 2; // Offset for flat top

          for (let i = 0; i < sides; i++) {
              const angle = i * angleStep + rotationOffset;
              const x = 50 + 50 * Math.cos(angle);
              const y = 50 + 50 * Math.sin(angle);
              points.push(`${x.toFixed(3)}% ${y.toFixed(3)}%`);
          }
          follower.style.clipPath = `polygon(${points.join(', ')})`;
      }
  }

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

  themeToggle.addEventListener('change', () => {
      body.classList.toggle('dark-mode', themeToggle.checked);
  });

  document.addEventListener("mousemove", (e) => {
      mousePos = new Vector2(e.clientX, e.clientY);
      target.style.left = `${mousePos.x}px`;
      target.style.top = `${mousePos.y}px`;
  });

  let lastTime = performance.now();
  function animate(currentTime) {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      const newPos = dynamics.update(deltaTime, mousePos);
      follower.style.left = `${newPos.x}px`;
      follower.style.top = `${newPos.y}px`;
      requestAnimationFrame(animate);
  }

  updateShape(); // Set initial shape on load
  requestAnimationFrame(animate);
});
