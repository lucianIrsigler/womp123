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
    socket.emit("startGame", currentRoom);
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

socket.on("playerJoined", ({ name, room }) => {
  const li = document.createElement("li");
  li.textContent = name;
  playerList.appendChild(li);
});

socket.on("updatePlayerList", (players) => {
  console.log(players);
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
    if (isHost) {
      startGameBtn.disabled = true;
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

// Modify the existing socket.on('gameStarted') handler
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

// Add this function to start sending gyroscope data
function startSendingGyroscopeData() {
  gyroscopeInterval = setInterval(() => {
    socket.emit("gyroscopeData", {
      roomCode: currentRoom,
      data: gyroscopeData,
    });
  }, 100); // Send data every 100ms
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
if (isHost) {
  socket.on("gyroscopeUpdate", ({ playerId, data }) => {
    updateGyroscopeDisplay(playerId, data);
  });
}

// Function to update the gyroscope display on the host screen
function updateGyroscopeDisplay(playerId, data) {
  const playerElement = document.getElementById(`player-${playerId}`);
  if (!playerElement) {
    const newPlayerElement = document.createElement("div");
    newPlayerElement.id = `player-${playerId}`;
    document.getElementById("gyroscope-data").appendChild(newPlayerElement);
  }
  document.getElementById(
    `player-${playerId}`
  ).textContent = `Player ${playerId}: Alpha: ${data.alpha.toFixed(
    2
  )}, Beta: ${data.beta.toFixed(2)}, Gamma: ${data.gamma.toFixed(2)}`;
}
