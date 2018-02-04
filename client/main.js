var canvas = document.getElementById("mainCanvas");
var ctx = canvas.getContext("2d");


// Assume the screen is already correctly translated to have the object be at 0
function drawShip(ctx) {
    ctx.save();
    if(this.dy != 0 || this.dx != 0) {
        this.angle = Math.atan2(this.dy, this.dx)
    }

    ctx.rotate(this.angle);

    ctx.rotate(Math.PI*0.5);

    

    ctx.beginPath();
    ctx.moveTo(5,5);
    ctx.lineTo(0,-7);
    ctx.lineTo(-5,5);
    ctx.lineTo(5,5);
    ctx.stroke();

    ctx.restore();
}

function drawBullet(ctx) {
    ctx.save();
    if(this.dy != 0 || this.dx != 0) {
        this.angle = Math.atan2(this.dy, this.dx) + Math.PI*0.5;
    }

    ctx.rotate(this.angle);

    ctx.strokeStyle = "#000000";

    

    ctx.beginPath();
    ctx.moveTo(1,1);
    ctx.lineTo(0,-2);
    ctx.lineTo(-1,1);
    ctx.lineTo(1,1);
    ctx.stroke();

    ctx.restore();
}



var idToObj = {};



function newShip(id) {
    return {
        id: id,

        px: 5,
        py: 5,
        pdx: 0,
        pdy: 0,
        nx: 5,
        ny: 5,
        ndx: 0.1,
        ndy: 0.1,

        x: 100,
        y: 100,
        dx: 10,
        dy: 10 ,

        angle: 0,

        draw: drawShip,
    };
}

function newBullet(id) {
    return {
        id: id,

        px: 5,
        py: 5,
        pdx: 0,
        pdy: 0,
        nx: 5,
        ny: 5,
        ndx: 0.1,
        ndy: 0.1,

        x: 100,
        y: 100,
        dx: 70,
        dy: 70 ,

        draw: drawBullet,
    };
}


var objects = [];

function generateNewObject(id, constructor) {
    var ship = constructor(id);
    objects.push(ship);
    idToObj[id] = objects.length-1;
    return ship;
}

var playerId = 12312;

var playerShip = generateNewObject(playerId, newShip);
generateNewObject(234123, newBullet);


function drawAll() {
    canvas.width = canvas.width;
    drawGrid(0,0,300,300);
    ctx.strokeStyle = "#000000";
    for(var i=0; i<objects.length; i++) {

        var obj = objects[i];
        ctx.save();
        ctx.translate(obj.x, obj.y);

        objects[i].draw(ctx);

        ctx.restore();
    }
}

function updateSmoothing(progress) {
    progress *= 0.001;

    playerShip.dx = dx*100;
    playerShip.dy = dy*100;
    

    for(var i=0; i<objects.length; i++) {
        var obj = objects[i];
        obj.x += progress*obj.dx;
        obj.y += progress*obj.dy;
    }

}


// Assume that the screen has been translated and whatever such that x,y,w,h are the coordinates of the 
function drawGrid(x,y,w,h){
    ctx.strokeStyle = "#eeeeee";

    var s = 10;

    for(var i = Math.floor(x/s)*s; i<Math.ceil((x+w)/s)*s; i+=s) {
        ctx.moveTo(i,y-1);
        ctx.lineTo(i,y+h-1);
        ctx.stroke();
    }

    for(var i = Math.floor(y/s)*s; i<Math.ceil((y+h)/s)*s; i+=s) {
        ctx.moveTo(x-1,i);
        ctx.lineTo(x+w-1,i);
        ctx.stroke();
    }

}


var prevTimestep = performance.now();
function drawStep(timestamp) {
    drawAll();
    var progress = timestamp - prevTimestep;
    prevTimestep = timestamp;
    updateSmoothing(progress);

    window.requestAnimationFrame(drawStep);
}

// In milliseconds
var attackCooldown = 100;

var canAttack = true;

function shootBullet() {
    var bullet = generateNewObject(Math.random()*1000, newBullet);
    bullet.x = playerShip.x;
    bullet.y = playerShip.y;
    bullet.dx = Math.cos(playerShip.angle)*200;
    bullet.dy = Math.sin(playerShip.angle)*200;
    bullet.x += Math.cos(playerShip.angle)*10;
    bullet.y += Math.sin(playerShip.angle)*10;
}


function attackNormal() {
    if (canAttack == true) {
        shootBullet();

        canAttack = false;
        setTimeout(function() {
            canAttack = true;
        }, attackCooldown);
    }
}

function attackSpecial() {
    if (canAttack == true) {
        shootBullet();
        playerShip.angle+=0.1;
        shootBullet();
        playerShip.angle-=0.1;
        playerShip.angle-=0.1;
        shootBullet();
        playerShip.angle+=0.1;

        canAttack = false;
        setTimeout(function() {
            canAttack = true;
        }, attackCooldown*3);
    }
}

var attackNormalButton = document.getElementById("attackNormalButton");
var attackSpecialButton = document.getElementById("attackSpecialButton");

attackNormalButton.onmousedown = attackNormalButton.ontouchstart = attackNormal;
attackSpecialButton.onmousedown = attackSpecialButton.ontouchstart = attackSpecial;

//drawStep(performance.now());

window.onresize = initializeGui;

initializeGui();
resetJoystick();

drawStep(performance.now());
