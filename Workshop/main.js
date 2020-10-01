; (function game(){
    const gameStartEl = document.getElementById("game-start")
    const gameScoreValue = document.getElementById("score-value")
    const gameAreaEl = document.getElementById("game-area")
    const gameOverEl = document.getElementById("game-over")
    const wizard = document.getElementById("wizard")
    let pressedKeys = new Set();
    const config = {
        speed:2,
        movingMultiplier :4,
        fireballMultipluer:5,
        fireBallInterval: 100,
        cloudInterval: 3000,
        bugInterval: 100,
        killBugScore: 200
    }
    function gameOn(){
        return{
            loopId : null,
            fireballTime : 0,
            cloudTime: 0,
            bugTime: 0
            
        }
    }
    let gameplay ;
    const utils = { 
        pxToNumber(val){
            return +val.replace('px','')
        },
        numberToPx(val){
            return `${val}px`
        },
        removeSceneElements(array){
            array.forEach(el => el.remove())
        }
    }
    const wizardCoordinates = {
        wizard,
        set x(newX){
            if(newX <= 0){
                newX = 0
            }else if (newX  >= gameAreaEl.offsetWidth - wizard.offsetWidth ){
                newX = gameAreaEl.offsetWidth - wizard.offsetWidth
            }
            this.wizard.style.left = utils.numberToPx(newX)
        },
        set y(newY){
            if(newY <= 0){
                newY = 0
            }else if(newY >= gameAreaEl.offsetHeight - wizard.offsetHeight){
                newY = gameAreaEl.offsetHeight - wizard.offsetHeight
            }
            this.wizard.style.top = utils.numberToPx(newY)
        },
        get x(){
            return utils.pxToNumber(this.wizard.style.left) ;
        },
        get y (){
            return utils.pxToNumber(this.wizard.style.top )
        }
    }
   
 
    gameStartEl.addEventListener("click", function gameStartHandler(){
        gameStartEl.classList.add('hidden')
        init();
    })
    function init(){
        gameplay = gameOn();
        wizard.classList.remove("hidden")
        gameOverEl.classList.add("hidden")
        utils.removeSceneElements(scene.bugs);
        gameScoreValue.innerText = 0;
        wizard.style.left = utils.numberToPx(200);
        wizard.style.top =  utils.numberToPx(200);
        gameLoop()
    }
    const pressedKeyActionMap = {
        ArrowUp(){
            wizardCoordinates.y -= config.speed * config.movingMultiplier
        },
        ArrowDown(){
            wizardCoordinates.y += config.speed * config.movingMultiplier
        },
        ArrowLeft(){
            wizardCoordinates.x -= config.speed * config.movingMultiplier
        },
        ArrowRight(){
            wizardCoordinates.x += config.speed * config.movingMultiplier
        },
        Space(timestamp){
            if(timestamp - gameplay.wizardFiredTime < config.fireBallInterval ){ return}
            gameplay.wizardFiredTime = timestamp;
            addFireBall()
            wizard.classList.add('wizard-fire');
               
        }
    }
    function processPressedKeys(timestamp){
        
        pressedKeys.forEach(pressedKey=>{
            const handler = pressedKeyActionMap[pressedKey];
            if(handler){ handler(timestamp)}
           
        })
    }

    function applyGravity(){
        wizardCoordinates.y += config.speed 
        
    }

    document.addEventListener("keyup", function keyUpHandler(e){
        stopFire()
        pressedKeys.delete(e.code)
      //  keys[e.code] = false;
    })
    
    document.addEventListener("keydown", function keyDownHandler(e){
        pressedKeys.add(e.code)
       // keys[e.code] = true;

    })
    function BugAndCloudFactory(timestamp,immerseTimeType,intervalSetType,elementName){
        let frequency = elementName === 'cloud' ? 20000 : elementName === 'bug' ? 500 : 0

        if(timestamp - gameplay[immerseTimeType] > config[intervalSetType]+ frequency*Math.random() ){
            gameplay[immerseTimeType]  = timestamp;
            
            let elementsCreate = elementName==='cloud' ? 1 :  randomizePosition(1,3)
            for (let index = 0; index < elementsCreate; index++) {
                createElementFactory(elementName)
            }

        }
    }
    function  createElementFactory(elementName){
        let width = elementName === 'cloud' ? 200 : elementName === 'bug' ? 60 : 0
        let div = document.createElement('div');
        div.classList.add(elementName)
        div.style.left = gameAreaEl.offsetWidth - width
        div.style.top = randomizePosition(0,gameAreaEl.offsetHeight - width)
        gameAreaEl.appendChild(div);
    }
    function randomizePosition(min,max){
        return Math.random() * (max - min) + min;
    }

    function addFireBall(){
        let fireBallEl = document.createElement('div');
        fireBallEl.style.left = utils.numberToPx(wizardCoordinates.x + wizard.offsetWidth)
        fireBallEl.style.top = utils.numberToPx(wizardCoordinates.y)
        fireBallEl.classList.add('fireball')
        gameAreaEl.appendChild(fireBallEl);
        
    }
    function stopFire(){
        if(wizard.classList.contains("wizard-fire") && pressedKeys.has("Space")){
            wizard.classList.remove("wizard-fire")
        }
    }

    const scene = {
       get  fireballs() {
            return  Array.from(document.querySelectorAll(".fireball"))
        },
        get clouds(){
            return Array.from(document.querySelectorAll('.cloud'))
        },
        get bugs(){
            return Array.from(document.querySelectorAll('.bug'))
        }
    }
    function isCollision(a, b){
        return !(
            (utils.pxToNumber(a.style.top ) + a.offsetHeight < utils.pxToNumber(b.style.top)) ||
            (utils.pxToNumber(a.style.top ) > b.offsetHeight + utils.pxToNumber(b.style.top)) ||
            (utils.pxToNumber(a.style.left ) > b.offsetWidth + utils.pxToNumber(b.style.left)) ||
            (utils.pxToNumber(a.style.left ) + a.offsetWidth < utils.pxToNumber(b.style.left))
        )
    }
    function gameOver(){
        window.cancelAnimationFrame(gameplay.loopId)
        gameOverEl.classList.remove('hidden');
        gameStartEl.classList.remove('hidden')
    }
    function processBugs(){
        scene.bugs.forEach(bug => {
            bug.style.left = utils.numberToPx(utils.pxToNumber(bug.style.left ) -  config.speed * config.movingMultiplier); 
            if(isCollision(wizard, bug)){
                console.log('collision')
                gameOver()
            }
            let fireballCur =  scene.fireballs.find(fireball => isCollision(bug,fireball))
            if(fireballCur){
                gameScoreValue.innerText = config.killBugScore + Number(gameScoreValue.innerText)
                bug.remove();
                fireballCur.remove();
            }else if(utils.pxToNumber( bug.style.left) <= 0){
                bug.remove();
            }
        })
    }
    function processClouds(){
        scene.clouds.forEach(cloud=> {
            cloud.style.left = utils.numberToPx(utils.pxToNumber(cloud.style.left ) -  config.speed); 
            if(utils.pxToNumber( cloud.style.left) <= 0){
                cloud.remove();
            }
        })
    }
    function processFireballs (){
        scene.fireballs.forEach(fireball => {
             fireball.style.left = utils.numberToPx(utils.pxToNumber(fireball.style.left) + config.speed * config.fireballMultipluer)
             if(utils.pxToNumber(fireball.style.left) >= gameAreaEl.offsetWidth -fireball.offsetWidth ){
                 fireball.remove();
             }
         })
    }
    function gameLoop(timestamp){
        gameplay.loopId = window.requestAnimationFrame(gameLoop);
        
        processPressedKeys(timestamp)
        if((wizardCoordinates.y < gameAreaEl.offsetHeight - wizard.offsetHeight)){
            applyGravity();
        }
        BugAndCloudFactory(timestamp,"cloudTime","cloudInterval","cloud");
        BugAndCloudFactory(timestamp,"bugTime","bugInterval","bug");
        processFireballs();
        processClouds();
        processBugs();
        gameScoreValue.innerHTML++;
    }
}());