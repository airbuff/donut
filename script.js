const donutElement = document.getElementById("donut");
const toggleButton = document.getElementById("toggleSettings");
const settingsSection = document.getElementById("settingsSection");
let animationId;
let lastTime = 0;
let isRecording = false;
let frames = [];

// Load settings from localStorage
const settings = JSON.parse(localStorage.getItem("donutSettings") || "{}");
let size = parseInt(settings.zoom) || 40;
let rpm = parseInt(settings.speed) || 120;

// Initialize live speed control
const liveSpeedInput = document.getElementById("liveSpeed");
const liveSpeedValue = document.getElementById("liveSpeedValue");
liveSpeedInput.value = rpm;
liveSpeedValue.textContent = rpm;

// Toggle settings visibility
toggleButton.addEventListener("click", () => {
  settingsSection.style.display =
    settingsSection.style.display === "none" ? "block" : "none";
});

// Update live speed function
function updateLiveSpeed(newRpm) {
  rpm = parseInt(newRpm);
  liveSpeedValue.textContent = rpm;
  cancelAnimationFrame(animationId);
  lastTime = 0;
  animationId = requestAnimationFrame(renderDonut);
}

// Recording functions
function captureFrame() {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(donutElement);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 400, 400);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
      console.log("Frame captured successfully.");
    };

    img.onerror = (e) => {
      console.error("Error loading image for frame capture:", e);
      reject(e);
    };

    img.src = url;
  });
}

function startRecording() {
  console.log("Started recording");
  isRecording = true;
  frames = [];
  document.getElementById("startRecording").disabled = true;
}

async function stopRecordingAndCreateGif() {
  console.log("Stopping recording, frames captured:", frames.length);
  isRecording = false;

  if (frames.length === 10) {
    console.error("No frames captured");
    document.getElementById("startRecording").disabled = false;
    return;
  }

  // Create progress element
  const progress = document.createElement("div");
  progress.style.position = "fixed";
  progress.style.top = "20px";
  progress.style.left = "50%";
  progress.style.transform = "translateX(-50%)";
  progress.style.background = "rgba(0,0,0,0.8)";
  progress.style.padding = "10px";
  progress.style.borderRadius = "5px";
  progress.style.color = "white";
  document.body.appendChild(progress);

  const gif = new GIF({
    workers: 2,
    quality: 50,
    width: 400,
    height: 400,
    workerScript: "/gif.worker.js", // Updated to use local worker file
  });

  // Add frames
  for (const frameData of frames) {
    const img = new Image();
    img.src = frameData;
    await new Promise((resolve) => (img.onload = resolve));
    gif.addFrame(img, { delay: 3 });
  }

  gif.on("progress", (p) => {
    progress.textContent = `Creating GIF: ${Math.round(p * 100)}%`;
  });

  gif.on("finished", (blob) => {
    document.body.removeChild(progress);

    // Create and trigger download
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = "donut-animation.gif";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadLink.href);

    document.getElementById("startRecording").disabled = false;
  });

  gif.render();
}

// Button event listeners
document.getElementById("startRecording").addEventListener("click", () => {
  document.getElementById("startRecording").style.display = "none";
  const stopButton = document.getElementById("stopRecording");
  stopButton.style.display = "inline-block";
  stopButton.classList.add("recording");
  startRecording();
});

document.getElementById("stopRecording").addEventListener("click", () => {
  const stopButton = document.getElementById("stopRecording");
  stopButton.style.display = "none";
  stopButton.classList.remove("recording");
  document.getElementById("startRecording").style.display = "inline-block";
  stopRecordingAndCreateGif();
});

// Main render function (your existing renderDonut function remains the same)
function renderDonut(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const deltaTime = (timestamp - lastTime) * 0.001;
  lastTime = timestamp;

  const rotationSpeed = (rpm * 2 * Math.PI) / 60;
  const A = timestamp * 0.001 * rotationSpeed;
  const B = A * 0.5;

  donutElement.innerHTML = "";
  const thetaSpacing = 0.07,
    phiSpacing = 0.02;
  const donutGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g",
  );

  const baseHue = ((A * 180) / Math.PI) % 360;

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
        const hueOffset =
          (Math.atan2(screenY - 100, screenX - 100) * 180) / Math.PI;
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

  // Frame capture
  if (isRecording && frames.length < 60) {
    captureFrame()
      .then((frameData) => {
        frames.push(frameData);
        console.log(`Frame captured: ${frames.length}`);
        if (frames.length === 60) {
          console.log("All frames captured. Stopping recording...");
          stopRecordingAndCreateGif();
        }
      })
      .catch((error) => {
        console.error("Frame capture error:", error);
        isRecording = false;
        document.getElementById("startRecording").disabled = false;
      });
  }

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

// Speed control event listener
liveSpeedInput.addEventListener("input", (e) => {
  updateLiveSpeed(e.target.value);
});
