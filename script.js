const donutElement = document.getElementById("donut");
let animationId;
let lastTime = 0;

// Load settings from localStorage
const settings = JSON.parse(localStorage.getItem("donutSettings") || "{}");
let size = parseInt(settings.zoom) || 40;
let rpm = parseInt(settings.speed) || 120; // Now using RPM instead of ms

// Initialize live speed control
const liveSpeedInput = document.getElementById("liveSpeed");
const liveSpeedValue = document.getElementById("liveSpeedValue");
liveSpeedInput.value = rpm;
liveSpeedValue.textContent = rpm;

function renderDonut(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const deltaTime = (timestamp - lastTime) * 0.001; // Convert to seconds
  lastTime = timestamp;

  const rotationSpeed = (rpm * 2 * Math.PI) / 60; // Convert RPM to radians per second
  const A = timestamp * 0.001 * rotationSpeed;
  const B = A * 0.5;

  donutElement.innerHTML = "";
  const thetaSpacing = 0.07,
    phiSpacing = 0.02;
  const donutGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g",
  );

  // Base hue that changes over time
  const baseHue = (timestamp * 0.05) % 360;

  for (let theta = 0; theta < 6.28; theta += thetaSpacing) {
    for (let phi = 0; phi < 6.28; phi += phiSpacing) {
      const sinA = Math.sin(A),
        cosA = Math.cos(A),
        sinB = Math.sin(B),
        cosB = Math.cos(B),
        cosTheta = Math.cos(theta),
        sinTheta = Math.sin(theta),
        cosPhi = Math.cos(phi),
        sinPhi = Math.sin(phi);

      const circleX = cosTheta + 2;
      const circleY = sinTheta;

      const x =
        circleX * (cosB * cosPhi + sinA * sinB * sinPhi) -
        circleY * cosA * sinB;
      const y =
        circleX * (sinB * cosPhi - sinA * cosB * sinPhi) +
        circleY * cosA * cosB;
      const zCoord = 1 / (circleX * cosA * sinPhi + circleY * sinA + 5);

      const screenX = 100 + size * zCoord * x;
      const screenY = 100 + size * zCoord * y;

      const lum =
        cosPhi * cosTheta * sinB -
        cosA * cosTheta * sinPhi -
        sinA * sinTheta +
        cosB * (cosA * sinTheta - cosTheta * sinA * sinPhi);

      if (lum > 0) {
        // Calculate hue based on position and time
        const hueOffset =
          ((Math.atan2(screenY - 100, screenX - 100) * 180) / Math.PI +
            (theta * 180) / Math.PI +
            (phi * 180) / Math.PI) *
          0.5;

        const hue = (baseHue + hueOffset) % 360;
        const saturation = 100;
        const lightness = Math.min(80, 40 + lum * 30);

        const donutPart = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle",
        );
        donutPart.setAttribute("cx", screenX);
        donutPart.setAttribute("cy", screenY);
        donutPart.setAttribute("r", Math.max(1, lum * 2));
        donutPart.setAttribute(
          "fill",
          `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        );
        donutGroup.appendChild(donutPart);
      }
    }
  }

  donutElement.appendChild(donutGroup);
  animationId = requestAnimationFrame(renderDonut);
}

// Start the animation
animationId = requestAnimationFrame(renderDonut);

// Cleanup on page unload
window.addEventListener("unload", () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
