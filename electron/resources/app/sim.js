"use strict";

let canvas = document.getElementById("display");
let ctx = canvas.getContext("2d");
let tracersCanvas = document.getElementById("tracers");
let tracersCtx = tracersCanvas.getContext("2d");

let particles = [];
/*Large numbers affect performance.
~500 max for 120fps.
~1300 max for 60fps.
~2900 max for 30fps.
*/
const NUM_OF_PARTICLES = 500
const MAX_PARTICLE_VELOCITY = 400; // In pixels per second.
const PARTICLE_DIAMETER = 10; // In pixels.
const PARTICLE_RADIUS = PARTICLE_DIAMETER / 2;
const PARTICLE_COLOR = "#ff9090";

const PATH_DRAWING_ENABLED = false;
const DYNAMIC_PATH_COLORS_ENABLED = false;
const DEFAULT_PATH_COLOR = "#3c2835";

const WALL_COLLISIONS_ENABLED = true;
const INTERPARTICLE_COLLISIONS_ENABLED = false;

const BROWNIAN_MOTION_STRENGTH = 0;
const BROWNIAN_MOTION_ENABLED = false;

const COEFFICIENT_OF_RESTITUTION_AGAINST_WALL = 0.7; // Between 0 and 1.

const GRAVITATIONAL_ACCELERATION = 0; // In pixels per second per second.

const IMAGE_SMOOTHING_ENABLED = false;
const IMAGE_SMOOTHING_QUALITY = ["low", "medium", "high"][2];

let lastTime, currentTime, deltaTime = 0;

// Calculating framerate
let frameTimeSum = 0;
let numOfFrames = 0;
let frameTimeFrequency = 0.5; // After how many seconds the framerate counter updates.

class Particle {
    constructor(x, y, xVel, yVel) {
        this.x = x;
        this.y = y;
        this.xVel = xVel;
        this.yVel = yVel;
        this.xPrev = x;
        this.yPrev = y;
        this.color = "#ff9090";
        this.isHidden = false;
    }
    get resultantVelocity() {
        return Math.sqrt(this.xVel * this.xVel + this.yVel * this.yVel);
    }
}

function generatePathColor(velocity) {
    velocity = parseInt(velocity);
    return "#" + (Math.round(velocity)).toString(16) + (Math.round(velocity)).toString(16) + (Math.round(velocity)).toString(16);
}

function reload() {
    location.reload();
    return false;
}

function keyDownHandler(e) {
    var keyCode = e.keyCode;
    if (keyCode == 82) {
        reload();
    }
}

function initializeParticles() {
    for (let i = 0; i < NUM_OF_PARTICLES; i++) {
        let angle = Math.random() * Math.PI * 2;
        let resultantVelocity = Math.random() * MAX_PARTICLE_VELOCITY;
        particles.push(new Particle(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            resultantVelocity * Math.cos(angle),
            resultantVelocity * Math.sin(angle),
            PARTICLE_COLOR));
    }
}

function resizeCanvas() {
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    var scale = window.devicePixelRatio;

    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    ctx.scale(scale, scale);
}

function update() {
    // Update canvas size (e.g. if window size has changed)

    // Clear canvas for redrawing.
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    currentTime = Date.now();
    deltaTime = (currentTime - lastTime) / 1000; // Gets the time since last frame in ms.
    lastTime = currentTime;

    frameTimeSum += deltaTime;
    numOfFrames++;

    document.getElementById("frametime").innerHTML = (deltaTime * 1000);

    if (frameTimeSum >= frameTimeFrequency) {
        document.getElementById("fps").innerHTML = (numOfFrames / frameTimeSum).toFixed(1);
        frameTimeSum = 0;
        numOfFrames = 0;
    }

    // Iterate through all particles.
    for (let i = 0; i < NUM_OF_PARTICLES; i++) {
        // Accelerate particle downwards.
        particles[i].yVel += GRAVITATIONAL_ACCELERATION;

        // Brownian motion
        if (BROWNIAN_MOTION_ENABLED) {
            particles[i].xVel += (Math.random() * BROWNIAN_MOTION_STRENGTH) - (BROWNIAN_MOTION_STRENGTH / 2);
            particles[i].yVel += (Math.random() * BROWNIAN_MOTION_STRENGTH) - (BROWNIAN_MOTION_STRENGTH / 2);
        }

        // Update particle position.
        particles[i].x += particles[i].xVel * deltaTime;
        particles[i].y += particles[i].yVel * deltaTime;

        // Check for collision after moving particle.
        if (WALL_COLLISIONS_ENABLED) {

            // Against left and right walls.
            if (particles[i].x >= (canvas.width - PARTICLE_RADIUS)) {
                particles[i].xVel = -particles[i].xVel * COEFFICIENT_OF_RESTITUTION_AGAINST_WALL;
                particles[i].x = canvas.width - PARTICLE_RADIUS;
            }

            if (particles[i].x <= PARTICLE_RADIUS) {
                particles[i].xVel = -particles[i].xVel * COEFFICIENT_OF_RESTITUTION_AGAINST_WALL;
                particles[i].x = PARTICLE_RADIUS;
            }

            // Against top and bottom walls.
            if (particles[i].y >= (canvas.height - PARTICLE_RADIUS)) {
                particles[i].yVel = -particles[i].yVel * COEFFICIENT_OF_RESTITUTION_AGAINST_WALL;
                particles[i].y = canvas.height - PARTICLE_RADIUS;
            }

            if (particles[i].y <= PARTICLE_RADIUS) {
                particles[i].yVel = -particles[i].yVel * COEFFICIENT_OF_RESTITUTION_AGAINST_WALL;
                particles[i].y = PARTICLE_RADIUS;
            }
        }

        // Check for collision with other particles using quadtree.
        if (INTERPARTICLE_COLLISIONS_ENABLED) {
            // TODO: Check collisions with other particles.
            // VERY INEFFICIENT! N^2 COMPLEXITY
            for (let j = 0; j < NUM_OF_PARTICLES; j++) {
                if (j == i) {
                    continue;
                }
                if (((particles[j].x - particles[i].x) * (particles[j].x - particles[i].x) +
                    (particles[j].y - particles[i].y) * (particles[j].y - particles[i].y)) <= (PARTICLE_DIAMETER * PARTICLE_DIAMETER)) {
                    // TODO: Bounce particles away from each other.
                    particles[i].color = particles[j].color = "#ff0000";
                }
            }
        }

        // Draw path from last position to current position.
        // Generate path color based on the speed of the particle
        if (PATH_DRAWING_ENABLED) {
            if (DYNAMIC_PATH_COLORS_ENABLED) {
                tracersCtx.strokeStyle = generatePathColor(particles[i].resultantVelocity);
            } else {
                tracersCtx.strokeStyle = "#3c2835"
            }
            tracersCtx.beginPath();
            tracersCtx.moveTo(particles[i].xPrev, particles[i].yPrev);
            tracersCtx.lineTo(particles[i].x, particles[i].y);
            tracersCtx.stroke();

            particles[i].xPrev = particles[i].x;
            particles[i].yPrev = particles[i].y;
        }

        // Particle drawing increases frame-time significantly.
        // Avoid drawing particles whenever possible,
        // i.e. not particles that are off-canvas.
        if (particles[i].isHidden) {
            continue;
        }

        if (!WALL_COLLISIONS_ENABLED) {
            if (particles[i].x < 0 - PARTICLE_RADIUS ||
                particles[i].x > canvas.width + PARTICLE_RADIUS ||
                particles[i].y < 0 - PARTICLE_RADIUS ||
                particles[i].y > canvas.height + PARTICLE_RADIUS) {
                continue;
            }
        }
        // Finally, draw the particle in its current position.

        // Method 1: Drawing and resizing an .svg image file.
        // ctx.drawImage(particleImage,
        //     particles[i].x - PARTICLE_DIAMETER / 2,
        //     particles[i].y - PARTICLE_DIAMETER / 2,
        //     PARTICLE_DIAMETER,
        //     PARTICLE_DIAMETER);

        // Method 2: Drawing a circlular arc onto the canvas.
        ctx.fillStyle = particles[i].color;
        ctx.beginPath();
        ctx.arc(particles[i].x, particles[i].y, PARTICLE_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
    }

    window.requestAnimationFrame(update);
}

window.onload = function () {
    document.addEventListener("keydown", keyDownHandler, false);
    resizeCanvas();
    initializeParticles();
    lastTime = Date.now();
    tracersCanvas.width = window.innerWidth;
    tracersCanvas.height = window.innerHeight;

    ctx.imageSmoothingEnabled = IMAGE_SMOOTHING_ENABLED;
    ctx.mozImageSmoothingEnabled = IMAGE_SMOOTHING_ENABLED;
    ctx.webkitImageSmoothingEnabled = IMAGE_SMOOTHING_ENABLED;
    if (IMAGE_SMOOTHING_ENABLED) {
        ctx.imageSmoothingQuality = IMAGE_SMOOTHING_QUALITY;
    }
    window.requestAnimationFrame(update);
};