const canvas = document.getElementById("gyro");
const ctx = canvas.getContext("2d")
let ballRadius = canvas.width / 10;
let originX = canvas.width / 2;
let originY = canvas.height / 2;
let ballX = originX;
let ballY = originY;
let dx = 0;
let dy = 0;

function resizeCanvas() {
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.5;
  canvas.width = size;
  canvas.height = size;
  ballRadius = canvas.width / 10;
  originX = canvas.width / 2;
  originY = canvas.height / 2;
  ballX = originX;
  ballY = originY;
  drawBall();
}

function drawBall() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function updateBallPosition() {
    let ballXCoordinate = ballX - originX;
    let ballYCoordinate = ballY - originY;
    let addXRadius = ballRadius;
    let addYRadius = ballRadius;
    let addXAdjustment;
    let addYAdjustment

    if (ballXCoordinate > 0) {
        addXRadius = ballRadius;
        addXAdjustment = -7;
    } else {
        addXRadius = -ballRadius;
        addXAdjustment = 7;
    }

    if (ballYCoordinate > 0) {
        addYRadius = ballRadius;
        addYAdjustment = -7;
    } else {
        addYRadius = -ballRadius;
        addYAdjustment = 7;
    }

  if ((Math.sqrt(Math.pow(ballXCoordinate + dx + addXRadius + addXAdjustment, 2) + Math.pow(ballYCoordinate + dy + addYRadius + addYAdjustment, 2)) > (canvas.width / 2))) {
    dx = 0;
    dy = 0;
  }
  ballX += dx;
  ballY += dy;

}

function handleOrientation(event) {
  let tiltY = -event.gamma; // left-to-right tilt in degrees [-90, 90]
  let tiltX = event.beta; // front-to-back tilt in degrees [-180, 180
  dx = tiltX / 10; // adjust speed
  dy = tiltY / 10; // adjust speed
}

function gameLoop() {
  updateBallPosition();
  drawBall();
  requestAnimationFrame(gameLoop);
}

window.addEventListener("deviceorientation", handleOrientation)

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial call to set up canvas size

gameLoop();