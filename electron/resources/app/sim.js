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
const NUM_OF_PARTICLES = 500;
const PATH_COLOR = "#3c2835";
const PARTICLE_COLOR = "#ff9090";
const PARTICLE_RADIUS = 5; // In pixels.
const MAX_PARTICLE_VELOCITY = 200; // In pixels per second.
const COEFFICIENT_OF_RESTITUTION_AGAINST_WALL = 0.7; // Between 0 and 1.
const GRAVITATIONAL_ACCELERATION = 0; // In pixels per second per second. (mimicking Earth's gravity, 1 pixel = 1m.)

let lastTime, currentTime, deltaTime = 0;

// Calculating framerate
let frameTimeSum = 0;
let numOfFrames = 0;
let frameTimeFrequency = 0.5; // After how many seconds the framerate counter updates.
let fpsLow, fpsHigh, fpsMean = 0;

class Particle {
    constructor(x, y, xVel, yVel, color, radius) {
        this.x = x;
        this.y = y;
        this.xVel = xVel;
        this.yVel = yVel;
        this.xPrev = x;
        this.yPrev = y;
        this.color = color;
        this.radius = radius;
    }
    getResultantVelocity() {
        return Math.sqrt(this.xVel * this.xVel + this.yVel + this.yVel);
    }
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
            canvas.width / 2,
            canvas.height / 2,
            resultantVelocity * Math.cos(angle),
            resultantVelocity * Math.sin(angle),
            PARTICLE_COLOR,
            PARTICLE_RADIUS));
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

    if (frameTimeSum >= frameTimeFrequency) {
        document.getElementById("fps").innerHTML = (numOfFrames / frameTimeSum).toFixed(1);
        frameTimeSum = 0;
        numOfFrames = 0;
    }

    for (let i = 0; i < particles.length; i++) {
        // Accelerate particle downwards.
        particles[i].yVel += GRAVITATIONAL_ACCELERATION;

        // Update particle position.
        particles[i].x += particles[i].xVel * deltaTime;
        particles[i].y += particles[i].yVel * deltaTime;

        // Check for collision after moving particle.

        // Against left and right walls.
        if (particles[i].x >= (canvas.width - particles[i].radius)) {
            particles[i].xVel = -particles[i].xVel * COEFFICIENT_OF_RESTITUTION_AGAINST_WALL;
            particles[i].x = canvas.width - particles[i].radius;
        }

        if (particles[i].x <= particles[i].radius) {
            particles[i].xVel = -particles[i].xVel * COEFFICIENT_OF_RESTITUTION_AGAINST_WALL;
            particles[i].x = particles[i].radius;
        }

        // Against top and bottom walls.
        if (particles[i].y >= (canvas.height - particles[i].radius)) {
            particles[i].yVel = -particles[i].yVel * COEFFICIENT_OF_RESTITUTION_AGAINST_WALL;
            particles[i].y = canvas.height - particles[i].radius;
        }

        if (particles[i].y <= particles[i].radius) {
            particles[i].yVel = -particles[i].yVel * COEFFICIENT_OF_RESTITUTION_AGAINST_WALL;
            particles[i].y = particles[i].radius;
        }

        // Draw path from last position to current position.
        tracersCtx.strokeStyle = PATH_COLOR;
        tracersCtx.beginPath();
        tracersCtx.moveTo(particles[i].xPrev, particles[i].yPrev);
        tracersCtx.lineTo(particles[i].x, particles[i].y);
        tracersCtx.stroke();

        particles[i].xPrev = particles[i].x;
        particles[i].yPrev = particles[i].y;

        // Redraw particle in new position.
        ctx.fillStyle = particles[i].color;
        ctx.beginPath();
        ctx.arc(particles[i].x, particles[i].y, particles[i].radius, 0, 2 * Math.PI);
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
    window.requestAnimationFrame(update);
};