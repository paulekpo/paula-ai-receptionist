const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Theme toggle ---------- */

const themeToggle = document.querySelector(".theme-toggle");

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle?.setAttribute("aria-checked", String(theme === "dark"));
  try {
    localStorage.setItem("paula-theme", theme);
  } catch (e) {}
}

themeToggle?.setAttribute("aria-checked", String(document.documentElement.dataset.theme !== "light"));
themeToggle?.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
});

/* ---------- ROI calculator ---------- */

const missedCallsInput = document.querySelector("#missed-calls");
const closeRateInput = document.querySelector("#close-rate");
const averageSaleInput = document.querySelector("#average-sale");
const monthlyLoss = document.querySelector("#monthly-loss");
const monthlyCalls = document.querySelector("#monthly-calls");
const lossDetail = document.querySelector("#loss-detail");

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const sliderOutputs = [
  { input: missedCallsInput, output: document.querySelector("#missed-calls-out"), format: (v) => String(v) },
  { input: closeRateInput, output: document.querySelector("#close-rate-out"), format: (v) => `${v}%` },
  { input: averageSaleInput, output: document.querySelector("#average-sale-out"), format: (v) => currency.format(v) },
];

function syncSlider({ input, output, format }) {
  if (!input) return;
  const min = Number(input.min) || 0;
  const max = Number(input.max) || 100;
  const value = clamp(Number(input.value) || 0, min, max);
  input.style.setProperty("--fill", `${((value - min) / (max - min)) * 100}%`);
  if (output) output.textContent = format(value);
}

function updateCalculator() {
  const missedPerDay = clamp(Number(missedCallsInput?.value) || 0, 0, 100);
  const closeRate = clamp(Number(closeRateInput?.value) || 0, 0, 100);
  const sale = clamp(Number(averageSaleInput?.value) || 0, 0, 1000000);
  const callsPerMonth = Math.round(missedPerDay * 30);
  const risk = callsPerMonth * (closeRate / 100) * sale;

  sliderOutputs.forEach(syncSlider);
  if (monthlyLoss) monthlyLoss.textContent = currency.format(risk);
  if (monthlyCalls) monthlyCalls.textContent = callsPerMonth.toLocaleString("en-US");
  if (lossDetail) {
    lossDetail.textContent = `${callsPerMonth.toLocaleString("en-US")} missed calls × ${closeRate}% × ${currency.format(sale)}`;
  }
}

[missedCallsInput, closeRateInput, averageSaleInput].forEach((input) => {
  input?.addEventListener("input", updateCalculator);
});

updateCalculator();

/* ---------- Mobile navigation ---------- */

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

function closeMenu() {
  siteNav?.classList.remove("is-open");
  menuToggle?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
}

menuToggle?.addEventListener("click", () => {
  const isOpen = siteNav?.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
  document.body.classList.toggle("menu-open", Boolean(isOpen));
});

siteNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

/* ---------- Header scroll state ---------- */

const header = document.querySelector(".site-header");

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

/* ---------- Scroll reveal ---------- */

const revealTargets = document.querySelectorAll("[data-reveal]");

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
  );

  revealTargets.forEach((target) => observer.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}

/* ---------- Button click ripple (ported from RippleButton) ---------- */

document.querySelectorAll("[data-ripple]").forEach((button) => {
  button.addEventListener("click", (event) => {
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });
});

/* ---------- Evervault hover cards (ported from EvervaultCard) ---------- */

const EV_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomString(length) {
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += EV_CHARS.charAt(Math.floor(Math.random() * EV_CHARS.length));
  }
  return result;
}

document.querySelectorAll("[data-evervault]").forEach((card) => {
  const chars = card.querySelector(".ev-chars");
  if (!chars) return;
  chars.textContent = randomString(900);

  let lastScramble = 0;
  card.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    const now = performance.now();
    if (now - lastScramble > 90) {
      chars.textContent = randomString(900);
      lastScramble = now;
    }
  });
});

/* ---------- Paula portrait: 3D tilt toward cursor ---------- */

const portraitCard = document.querySelector(".portrait-card");
const meetCard = document.querySelector(".meet-card");

if (portraitCard && meetCard && !prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
  const glare = portraitCard.querySelector(".portrait-glare");

  meetCard.addEventListener("mousemove", (event) => {
    const rect = portraitCard.getBoundingClientRect();
    const relX = (event.clientX - rect.left - rect.width / 2) / rect.width;
    const relY = (event.clientY - rect.top - rect.height / 2) / rect.height;
    portraitCard.style.setProperty("--tilt-y", `${clamp(relX, -0.9, 0.9) * 10}deg`);
    portraitCard.style.setProperty("--tilt-x", `${clamp(relY, -0.9, 0.9) * -10}deg`);
    if (glare) {
      portraitCard.style.setProperty("--glare-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      portraitCard.style.setProperty("--glare-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    }
  });

  meetCard.addEventListener("mouseleave", () => {
    portraitCard.style.setProperty("--tilt-x", "0deg");
    portraitCard.style.setProperty("--tilt-y", "0deg");
  });
}

/* ---------- Hero video sound toggle ---------- */

const soundToggle = document.querySelector(".sound-toggle");
const heroVideo = document.querySelector(".portrait-card video");

if (soundToggle && heroVideo) {
  soundToggle.addEventListener("click", () => {
    heroVideo.muted = !heroVideo.muted;
    soundToggle.setAttribute("aria-pressed", String(!heroVideo.muted));
    const label = soundToggle.querySelector(".sound-label");
    if (label) label.textContent = heroVideo.muted ? "Unmute" : "Mute";
    if (!heroVideo.muted) {
      heroVideo.currentTime = 0;
      heroVideo.play().catch(() => {});
    }
  });
}

/* ---------- Flowing background: blobs glide between section waypoints ---------- */

const flowLayer = document.querySelector(".page-flow");

if (flowLayer && !prefersReducedMotion) {
  const blobs = [
    { el: flowLayer.querySelector(".flow-a"), x: 22, y: 28, tx: 22, ty: 28 },
    { el: flowLayer.querySelector(".flow-b"), x: 80, y: 62, tx: 80, ty: 62 },
    { el: flowLayer.querySelector(".flow-c"), x: 55, y: 96, tx: 55, ty: 96 },
  ];
  const flowSections = Array.from(document.querySelectorAll("main > *"));

  // serpentine waypoints: the glow sweeps to the opposite side each section
  function waypointFor(index) {
    const even = index % 2 === 0;
    return [
      { x: even ? 22 : 78, y: 26 },
      { x: even ? 80 : 20, y: 64 },
      { x: even ? 58 : 42, y: 98 },
    ];
  }

  const easeInOut = (t) => t * t * (3 - 2 * t);
  let flowRunning = false;

  function flowFrame() {
    let settled = true;
    blobs.forEach((blob) => {
      blob.x += (blob.tx - blob.x) * 0.045;
      blob.y += (blob.ty - blob.y) * 0.045;
      blob.el.style.setProperty("--bx", blob.x.toFixed(2));
      blob.el.style.setProperty("--by", blob.y.toFixed(2));
      if (Math.abs(blob.tx - blob.x) > 0.05 || Math.abs(blob.ty - blob.y) > 0.05) settled = false;
    });
    if (settled) {
      flowRunning = false;
    } else {
      requestAnimationFrame(flowFrame);
    }
  }

  function updateFlow() {
    const center = window.scrollY + window.innerHeight / 2;
    let position = 0;
    for (let i = 0; i < flowSections.length; i += 1) {
      const rect = flowSections[i].getBoundingClientRect();
      const top = rect.top + window.scrollY;
      if (center >= top + rect.height) {
        position = i + 1;
      } else if (center >= top) {
        position = i + (center - top) / rect.height;
        break;
      }
    }
    position = clamp(position, 0, flowSections.length - 1);
    const index = Math.floor(position);
    const blend = easeInOut(position - index);
    const from = waypointFor(index);
    const to = waypointFor(index + 1);
    blobs.forEach((blob, i) => {
      blob.tx = from[i].x + (to[i].x - from[i].x) * blend;
      blob.ty = from[i].y + (to[i].y - from[i].y) * blend;
    });
    if (!flowRunning) {
      flowRunning = true;
      requestAnimationFrame(flowFrame);
    }
  }

  window.addEventListener("scroll", updateFlow, { passive: true });
  window.addEventListener("resize", updateFlow, { passive: true });
  updateFlow();
}

/* ---------- Hero feature hover spotlight ---------- */

document.querySelectorAll(".hero-feature").forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--hx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    card.style.setProperty("--hy", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  });
});

/* ---------- Gentle hero parallax ---------- */

if (!prefersReducedMotion) {
  const hero = document.querySelector(".hero");
  let driftTicking = false;

  function updateDrift() {
    driftTicking = false;
    if (!hero) return;
    const y = Math.min(window.scrollY, window.innerHeight);
    hero.style.setProperty("--scroll-drift", `${(y * 0.16).toFixed(1)}px`);
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!driftTicking) {
        driftTicking = true;
        requestAnimationFrame(updateDrift);
      }
    },
    { passive: true },
  );
  updateDrift();
}

/* ---------- Pricing shader background (ported from ShaderCanvas) ---------- */

const shaderCanvas = document.querySelector(".pricing-shader");

if (shaderCanvas && !prefersReducedMotion) {
  const gl = shaderCanvas.getContext("webgl");

  if (gl) {
    const vertexSrc = "attribute vec2 aPosition; void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }";
    const fragmentSrc = `
      precision highp float;
      uniform float iTime;
      uniform vec2 iResolution;
      uniform vec3 uBackgroundColor;
      float variation(vec2 v1, vec2 v2, float strength, float speed) {
        return sin(dot(normalize(v1), normalize(v2)) * strength + iTime * speed) / 100.0;
      }
      vec3 paintCircle(vec2 uv, vec2 center, float rad, float width) {
        vec2 diff = center - uv;
        float len = length(diff);
        len += variation(diff, vec2(0.0, 1.0), 5.0, 2.0);
        len -= variation(diff, vec2(1.0, 0.0), 5.0, 2.0);
        float circle = smoothstep(rad - width, rad, len) - smoothstep(rad, rad + width, len);
        return vec3(circle);
      }
      mat2 rotate2d(float angle) { float c = cos(angle), s = sin(angle); return mat2(c, -s, s, c); }
      void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        uv.x *= 1.5;
        uv.x -= 0.25;
        float mask = 0.0;
        float radius = 0.35;
        vec2 center = vec2(0.5);
        mask += paintCircle(uv, center, radius, 0.035).r;
        mask += paintCircle(uv, center, radius - 0.018, 0.01).r;
        mask += paintCircle(uv, center, radius + 0.018, 0.005).r;
        vec2 v = rotate2d(iTime) * uv;
        // brand hues: sea teal -> slate blue
        vec3 foregroundColor = mix(vec3(0.20, 0.75, 0.64), vec3(0.29, 0.56, 0.76), clamp(v.y + 0.5, 0.0, 1.0));
        vec3 color = mix(uBackgroundColor, foregroundColor, mask);
        color = mix(color, vec3(1.0), paintCircle(uv, center, radius, 0.003).r);
        gl_FragColor = vec4(color, 1.0);
      }`;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertex = compile(gl.VERTEX_SHADER, vertexSrc);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSrc);

    if (vertex && fragment) {
      const program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const aPosition = gl.getAttribLocation(program, "aPosition");
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

      const iTimeLoc = gl.getUniformLocation(program, "iTime");
      const iResLoc = gl.getUniformLocation(program, "iResolution");
      const bgLoc = gl.getUniformLocation(program, "uBackgroundColor");

      const setBackground = () => {
        const light = document.documentElement.dataset.theme === "light";
        gl.uniform3fv(bgLoc, new Float32Array(light ? [0.973, 0.969, 0.957] : [0.059, 0.078, 0.098]));
      };
      setBackground();
      new MutationObserver(setBackground).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });

      const resize = () => {
        const rect = shaderCanvas.getBoundingClientRect();
        shaderCanvas.width = Math.max(1, Math.floor(rect.width));
        shaderCanvas.height = Math.max(1, Math.floor(rect.height));
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      };
      resize();
      window.addEventListener("resize", resize, { passive: true });

      let running = false;
      let frameId = 0;

      const render = (time) => {
        gl.uniform1f(iTimeLoc, time * 0.001);
        gl.uniform2f(iResLoc, shaderCanvas.width, shaderCanvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        if (running) frameId = requestAnimationFrame(render);
      };

      // only animate while the pricing section is on screen
      const shaderObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !running) {
            running = true;
            frameId = requestAnimationFrame(render);
          } else if (!entry.isIntersecting && running) {
            running = false;
            cancelAnimationFrame(frameId);
          }
        });
      });
      shaderObserver.observe(shaderCanvas);
    }
  } else {
    shaderCanvas.remove();
  }
} else if (shaderCanvas && prefersReducedMotion) {
  shaderCanvas.remove();
}

/* ---------- Footer year ---------- */

const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());
