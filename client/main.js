var canvas = document.getElementById("mainCanvas");
var ctx = canvas.getContext("2d");


// Assume the screen is already correctly translated to have the object be at 0
function drawShip(ctx) {
    ctx.save();
    this.angle = Math.atan2(this.dy, this.dx) + Math.PI*0.5;

    ctx.rotate(this.angle);

    ctx.strokeStyle = "#000000";

    

    ctx.beginPath();
    ctx.moveTo(5,5);
    ctx.lineTo(0,-7);
    ctx.lineTo(-5,5);
    ctx.lineTo(5,5);
    ctx.stroke();

    ctx.restore();
}


var idToObj = {};


function newBullet(id,) {
    return {};
}


function newShip() {
    return {
        id: 12312,

        px: 5,
        py: 5,
        pdx: 0,
        pdy: 0,
        nx: 5,
        ny: 5,
        ndx: 0.1,
        ndy: 0.1,

        x: 5,
        y: 5,
        dx: 10,
        dy: 10 ,

        angle: 0,

        draw: drawShip,
    };
}



var objects = [newShip()];


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

    for(var i=0; i<objects.length; i++) {
        var obj = objects[i];
        obj.x += progress*obj.dx;
        obj.y += progress*obj.dy;
    }

    obj.dx += (Math.random()-0.5)*5;
    obj.dy += (Math.random()-0.5)*5;
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

drawStep(performance.now());


function initializeGui() {

    canvas.width = window.innerWidth;
    canvas.height = window.outerHeight;

    //window.scrollTo(0,1);

    //canvas.width = window.innerWidth;
    //canvas.height = window.innerHeight;
}

window.onresize = initializeGui;

initializeGui();
