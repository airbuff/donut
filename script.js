const donutElement = document.getElementById('donut');
let A = 0, B = 0; // rotation angles

// Load settings from localStorage
const settings = JSON.parse(localStorage.getItem('donutSettings') || '{}');
let color = settings.color || '#ffffff';
let size = parseInt(settings.zoom) || 40;
let speed = parseInt(settings.speed) || 50;

// Initialize live speed control
const liveSpeedInput = document.getElementById('liveSpeed');
const liveSpeedValue = document.getElementById('liveSpeedValue');
liveSpeedInput.value = speed;
liveSpeedValue.textContent = speed;

let animationInterval;

function updateLiveSpeed(newSpeed) {
    speed = parseInt(newSpeed);
    liveSpeedValue.textContent = speed;
    clearInterval(animationInterval);
    animationInterval = setInterval(renderDonut, speed);
}

function renderDonut() {
    donutElement.innerHTML = ''; // Clear previous SVG content
    const thetaSpacing = 0.07, phiSpacing = 0.02; // detail level
    const donutGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    for (let theta = 0; theta < 6.28; theta += thetaSpacing) {
        for (let phi = 0; phi < 6.28; phi += phiSpacing) {
            const sinA = Math.sin(A), cosA = Math.cos(A),
                  sinB = Math.sin(B), cosB = Math.cos(B),
                  cosTheta = Math.cos(theta), sinTheta = Math.sin(theta),
                  cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);

            const circleX = cosTheta + 2; // x position
            const circleY = sinTheta;     // y position

            const x = circleX * (cosB * cosPhi + sinA * sinB * sinPhi) - 
                     circleY * cosA * sinB;
            const y = circleX * (sinB * cosPhi - sinA * cosB * sinPhi) + 
                     circleY * cosA * cosB;
            const zCoord = 1 / (circleX * cosA * sinPhi + circleY * sinA + 5);

            const screenX = 100 + size * zCoord * x;
            const screenY = 100 + size * zCoord * y;

            const lum = cosPhi * cosTheta * sinB - 
                       cosA * cosTheta * sinPhi - 
                       sinA * sinTheta + 
                       cosB * (cosA * sinTheta - cosTheta * sinA * sinPhi);

            if (lum > 0) {
                const donutPart = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                donutPart.setAttribute("cx", screenX);
                donutPart.setAttribute("cy", screenY);
                donutPart.setAttribute("r", Math.max(1, lum * 2));
                donutPart.setAttribute("fill", color);
                donutGroup.appendChild(donutPart);
            }
        }
    }

    donutElement.appendChild(donutGroup);
    A += 0.04;
    B += 0.02;
}

// Start the animation
animationInterval = setInterval(renderDonut, speed);
