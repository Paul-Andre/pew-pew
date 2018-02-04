var canvas = document.getElementById("mainCanvas");
var ctx = canvas.getContext("2d");


// Assume the screen is already correctly translated to have the object be at 0
function drawShip(ctx) {
    ctx.save();
    /*
    if(this.dy != 0 || this.dx != 0) {
        this.angle = Math.atan2(this.dy, this.dx)
    }
    */

    ctx.fillStype = "black"
    ctx.fillRect(-10,12, this.health/this.maxHealth * 20,2);
    //alert(this.health,this.maxHealth);


    ctx.rotate(this.angle);

    ctx.rotate(Math.PI*0.5);

    ctx.beginPath();
    ctx.moveTo(6,6);
    ctx.lineTo(0,-7);
    ctx.lineTo(-6,6);
    ctx.lineTo(6,6);
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






function newShip(id) {
    return {
        id: id,

        nx: 5,
        ny: 5,
        ndx: 0.1,
        ndy: 0.1,
        ntimestamp: 0.0,

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

        nx: 5,
        ny: 5,
        ndx: 0.1,
        ndy: 0.1,
        ntimestamp: 0.0,

        x: 100,
        y: 100,
        dx: 70,
        dy: 70 ,

        draw: drawBullet,
    };
}



function generateNewObject(id, constructor) {
    var ship = constructor(id);
    objects.push(ship);
    idToObj[id] = ship;
    return ship;
}



function drawAll() {
    canvas.width = canvas.width;
    //drawGrid(0,0,300,300);
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
    var now = performance.now() * 0.001;
    progress *= 0.001;

    //playerShip.dx = dx*100;
    //playerShip.dy = dy*100;
    

    for(var i=0; i<objects.length; i++) {
        var obj = objects[i];

        var px = obj.x + progress*obj.dx;
        var py = obj.y + progress*obj.dy;

        var nt = now - obj.ntimestamp*0.001;

        var nx = obj.nx + obj.ndx*nt;
        var ny = obj.ny + obj.ndy*nt;

        //var rate = (1/(1+Math.exp(-nt*2))-0.5)*2; // Should depend on progress
        var rate = 0.5;

        obj.x = px * (1-rate) + nx * rate;
        obj.y = py * (1-rate) + ny * rate;
        obj.dx = obj.dx * (1-rate) + obj.ndx * rate;
        obj.dy = obj.dy * (1-rate) + obj.ndy * rate;

        
        /*
        obj.x = nx
        obj.y = ny
        obj.dx = obj.ndx
        obj.dy = obj.ndy
        */
        
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
    ws.send(JSON.stringify({
        Move: "AttackNormal"
    }));
    /*
    if (canAttack == true) {
        shootBullet();

        canAttack = false;
        setTimeout(function() {
            canAttack = true;
        }, attackCooldown);
    }
    */
}

function attackSpecial() {
    ws.send(JSON.stringify({
        Move: "AttackSpecial"
    }));
    /*
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
    */
}

var attackNormalButton = document.getElementById("attackNormalButton");
var attackSpecialButton = document.getElementById("attackSpecialButton");

attackNormalButton.onmousedown = attackNormalButton.ontouchstart = attackNormal;
attackSpecialButton.onmousedown = attackSpecialButton.ontouchstart = attackSpecial;

//drawStep(performance.now());



var playerId = -2323;
var width = 100;
var height = 100;
var playerShip;

var idToObj = {};
var objects = [];

var ws = new WebSocket("ws://"+location.hostname + ":9000");
var hadFirstMessage = false;
ws.onmessage = function(event) {
    if (!hadFirstMessage) {
        playerId = JSON.parse(event.data);
        ws.send(JSON.stringify({Info:
            {
                name: "",
                color: "",
            }
        }));
        playerShip = generateNewObject(playerId, newShip);
        hadFirstMessage = true;

        window.onresize = initializeGui;

        initializeGui();
        resetJoystick();

        drawStep(performance.now());
    }
    else {
        var message = JSON.parse(event.data);
        if (message.width) width = message.width;
        if (message.height) height = message.height;
        if (message.asdasdf) {
            alert("werqwe");
        }
        if (message.game_objects) {
            var prevObjects = objects;
            var prevIdToObj = idToObj;

            idToObj = {};
            objects = [];

            for (var id in message.game_objects) {
                var obj_rep = message.game_objects[id];
                var obj;
                if (id in prevIdToObj) {
                    obj = prevIdToObj[id];
                }
                else {
                    if (obj_rep.spec.Ship) {
                        obj = generateNewObject(id, newShip);
                    }
                    else if (obj_rep.spec.Bullet) {
                        obj = generateNewObject(id, newBullet);
                    }
                    obj.x = obj_rep.exis.loc.x;
                    obj.y = obj_rep.exis.loc.y;
                    obj.dx = obj_rep.exis.dloc.x;
                    obj.dy = obj_rep.exis.dloc.y;
                }

                idToObj[id] = obj;
                objects.push(obj);

                obj.nx = obj_rep.exis.loc.x;
                obj.ny = obj_rep.exis.loc.y;
                obj.ndx = obj_rep.exis.dloc.x;
                obj.ndy = obj_rep.exis.dloc.y;
                obj.ntimestamp = performance.now();

                obj.angle = obj_rep.exis.angle;

                if (obj_rep.spec.Ship) {
                    obj.health = obj_rep.spec.Ship.health;
                    obj.maxHealth = obj_rep.spec.Ship.max_health;
                }
            }
        }

        ws.send(JSON.stringify({
            Move: {
                Thrust: {
                    x: dx,
                    y: dy,
                }
            }
        }));

    }
}


ws.onclose = function() {
    setTimeout( function() {
        location.reload();
    }, 500);
};




