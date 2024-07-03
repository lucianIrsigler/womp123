const socket = io();

const mainMenu = document.getElementById("main-menu");
const joinForm = document.getElementById("join-form");
const lobby = document.getElementById("lobby");
const game = document.getElementById("game");
const createRoomBtn = document.getElementById("create-room");
const joinRoomBtn = document.getElementById("join-room");
const submitJoinBtn = document.getElementById("submit-join");
const startGameBtn = document.getElementById("start-game");
const playerNameInput = document.getElementById("player-name");
const roomCodeInput = document.getElementById("room-code");
const roomCodeDisplay = document.getElementById("room-code-display");
const playerList = document.getElementById("player-list");
const roomStatus = document.getElementById("room-status");

let currentRoom = null;
let isHost = false;
let gyroscopeInterval = null;
const gyroscopeData = { alpha: 0, beta: 0, gamma: 0 };


let numRows = 10;
let numCols = 10;

class Maze {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = this.createGrid();
    this.walls = [];
    this.generateMaze(0, 0);
  }

  createGrid() {
    const grid = [];
    for (let x = 0; x < this.width; x++) {
      grid[x] = [];
      for (let y = 0; y < this.height; y++) {
        grid[x][y] = { visited: false, walls: [true, true, true, true] }; // top, right, bottom, left
      }
    }
    return grid;
  }

  generateMaze(cx, cy) {
    const directions = [
      { dx: 0, dy: -1, wall: 0, opposite: 2 }, // Up
      { dx: 1, dy: 0, wall: 1, opposite: 3 }, // Right
      { dx: 0, dy: 1, wall: 2, opposite: 0 }, // Down
      { dx: -1, dy: 0, wall: 3, opposite: 1 }, // Left
    ];

    this.grid[cx][cy].visited = true;

    // Shuffle directions
    for (let i = directions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [directions[i], directions[j]] = [directions[j], directions[i]];
    }

    for (const { dx, dy, wall, opposite } of directions) {
      const nx = cx + dx;
      const ny = cy + dy;

      if (
        nx >= 0 &&
        nx < this.width &&
        ny >= 0 &&
        ny < this.height &&
        !this.grid[nx][ny].visited
      ) {
        this.grid[cx][cy].walls[wall] = false;
        this.grid[nx][ny].walls[opposite] = false;
        this.generateMaze(nx, ny);
      }
    }
  }

  getWalls() {
    const walls = [];
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.grid[x][y].walls[0])
          walls.push({ column: x, row: y, horizontal: true, length: 1 });
        if (this.grid[x][y].walls[1])
          walls.push({ column: x + 1, row: y, horizontal: false, length: 1 });
        if (this.grid[x][y].walls[2])
          walls.push({ column: x, row: y + 1, horizontal: true, length: 1 });
        if (this.grid[x][y].walls[3])
          walls.push({ column: x, row: y, horizontal: false, length: 1 });
      }
    }
    return walls;
  }
}

function generateNewMaze(rows, cols) {
  const maze = new Maze(rows, cols);
  const walls = maze.getWalls();
  return JSON.stringify(walls, null, 2);
}


createRoomBtn.addEventListener("click", () => {
  socket.emit("createRoom");
});

joinRoomBtn.addEventListener("click", () => {
  mainMenu.style.display = "none";
  joinForm.style.display = "block";
});

submitJoinBtn.addEventListener("click", () => {
  const name = playerNameInput.value.trim();
  const roomCode = roomCodeInput.value.trim();
  if (name && roomCode) {
    socket.emit("joinRoom", { name, roomCode });
  }
});

startGameBtn.addEventListener("click", () => {
  if (currentRoom) {
    if (isHost){
      const roomCode = roomCodeDisplay.textContent.trim();
      const map = JSON.parse(generateNewMaze(numRows, numCols))
      socket.emit("transmitMap",{map,roomCode});
      socket.emit("startGame", currentRoom);
    }
  }
});
socket.on("roomCreated", (roomCode) => {
  currentRoom = roomCode;
  isHost = true;
  mainMenu.style.display = "none";
  lobby.style.display = "block";
  roomCodeDisplay.textContent = roomCode;
  startGameBtn.style.display = "block";
  roomStatus.textContent = "Waiting for players...";
});

socket.on("joinedRoom", ({ roomCode, isHost: hostStatus }) => {
  currentRoom = roomCode;
  isHost = hostStatus;
  joinForm.style.display = "none";
  lobby.style.display = "block";
  roomCodeDisplay.textContent = roomCode;
  if (isHost) {
    startGameBtn.style.display = "block";
  }
});

socket.on("playerJoined", ({ name,room }) => {
  const li = document.createElement("li");
  li.textContent = name;
  playerList.appendChild(li);
});

socket.on("updatePlayerList", (players) => {
  updatePlayerList(players);
});

socket.on("playerLeft", ({ name }) => {
  const players = Array.from(playerList.children);
  const playerToRemove = players.find((p) => p.textContent === name);
  if (playerToRemove) {
    playerList.removeChild(playerToRemove);
  }
  roomStatus.textContent = "Waiting for players...";
});

socket.on("roomFull", () => {
  roomStatus.textContent = "Room is full. Ready to start!";
  if (isHost) {
    startGameBtn.disabled = false;
  }
});

socket.on("gameStarted", () => {
  lobby.style.display = "none";
  game.style.display = "block";

  if (!isHost) {
    // Request permission to use the gyroscope on mobile devices
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      DeviceOrientationEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
            startSendingGyroscopeData();
          }
        })
        .catch(console.error);
    } else {
      // For devices that don't require permission
      window.addEventListener("deviceorientation", handleOrientation);
      startSendingGyroscopeData();
    }


  }
});

socket.on("error", (message) => {
  alert(message);
});

function updatePlayerList(players) {
  playerList.innerHTML = "";
  players.forEach((player) => {
    const li = document.createElement("li");
    li.textContent = player.name;
    playerList.appendChild(li);
  });

  if (players.length < 4) {
    roomStatus.textContent = `Waiting for players... (${players.length}/4)`;
    if (isHost && players.length>=1) {
      startGameBtn.disabled = false;
    }
  } else {
    roomStatus.textContent = "Room is full. Ready to start!";
    if (isHost) {
      startGameBtn.disabled = false;
    }
  }
}

// Add this function to handle gyroscope data
function handleOrientation(event) {
  gyroscopeData.alpha = event.alpha; // Z-axis rotation
  gyroscopeData.beta = event.beta; // X-axis rotation
  gyroscopeData.gamma = event.gamma; // Y-axis rotation
}


// Add this function to start sending gyroscope data
function startSendingGyroscopeData() {
  if (!isHost){
    gyroscopeInterval = setInterval(() => {
    socket.emit("gyroscopeData", {
      roomCode: currentRoom,
      data: gyroscopeData,
    });
    }, 100); // Send data every 100ms
  }
}

// Add this to clean up when the game ends or the user disconnects
function stopSendingGyroscopeData() {
  if (gyroscopeInterval) {
    clearInterval(gyroscopeInterval);
    gyroscopeInterval = null;
  }
  window.removeEventListener("deviceorientation", handleOrientation);
}

// Add a handler for gyroscope data on the host side
socket.on("gyroscopeUpdate", ({ playerInfo, data }) => {
  console.log(data);
  updateGyroscopeDisplay(playerInfo, data);
});

// Function to update the gyroscope display on the host screen
function updateGyroscopeDisplay(playerInfo, data) {
  const playerId = playerInfo.id
  const name = playerInfo.name

  const playerElement = document.getElementById(`player-${playerId}`);

  if (!playerElement) {
    const text = document.createElement("div");
    text.id=`player-${playerId}-text`

    const newPlayerElement = document.createElement("div");
    newPlayerElement.id = `player-${playerId}`;
    newPlayerElement.classList.add("garden")

    const ball = document.createElement("div");
    ball.id = `player-${playerId}-ball`;
    ball.classList.add("ball")

    document.getElementById("gyroscope-data").appendChild(newPlayerElement);
    document.getElementById(`player-${playerId}`).appendChild(ball)
    document.getElementById(`player-${playerId}`).appendChild(text)
  }

  updateThing(document.getElementById(`player-${playerId}`),
      document.getElementById(`player-${playerId}-ball`),
      data.beta,
      data.gamma)

  
  
  document.getElementById(
    `player-${playerId}-text`
  ).textContent = `Player ${name}:
  Beta: ${data.beta.toFixed(2)}, Gamma: ${data.gamma.toFixed(2)}`;

}

function updateThing(garden,ball,beta,gamma) {
  const maxX = garden.clientWidth - ball.clientWidth;
  const maxY = garden.clientHeight - ball.clientHeight;

  let x = beta; // In degree in the range [-180,180)
  let y = gamma; // In degree in the range [-90,90)
  

  if (x > 90) {
    x = 90;
  }
  if (x < -90) {
    x = -90;
  }

  // To make computation easier we shift the range of
  // x and y to [0,180]
  x += 90;
  y += 90;
  ball.style.left = `${(maxY * y) / 180 - 10}px`; // rotating device around the y axis moves the ball horizontally
  ball.style.top = `${(maxX * x) / 180 - 10}px`; // rotating device around the x axis moves the ball vertically
}


