const socket1 = io();

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

socket1.on("updateBall",(playerID,data)=>{
    updateGyroscopeDisplay(playerID, data);
})


function updateGyroscopeDisplay(playerId, data) {
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
    ).textContent = `Player ${playerId}:
    X: ${data.x}, Y: ${data.y}`;
  
  }
  
  function updateThing(garden,ball,beta,gamma) {
    //ball.style.left = `${(maxY * y) / 180 - 10}px`; // rotating device around the y axis moves the ball horizontally
    //ball.style.top = `${(maxX * x) / 180 - 10}px`; // rotating device around the x axis moves the ball vertically
  }
  
  