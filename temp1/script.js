const ks = new Audio('audio/downer_noise.mp3')
let userinteraction = 0

document.addEventListener('click',()=>{
    console.log("ds")
    if(userinteraction) return;
    userinteraction++;
    ks.play()
})