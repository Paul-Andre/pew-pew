
var mba = document.getElementById("joystickAreaOverlay");
var joystick = document.getElementById("joystick");

mba.addEventListener("mousemove", function(event) {
    var x = event.layerX;
    var y = event.layerY;

    moveJoystick(x - joystickCenterX, y - joystickCenterY);

},false);

var dx = 0;
var dy = 0;

var joystickCenterX = 80;
var joystickCenterY = 80;
var joystickStiff = 20;

function joystickFunction(x) {
    x/=joystickStiff;
    var y = (1/(1 +Math.exp(-x*1.5))-0.5)*2;
    return y;
}


function moveJoystick(x,y) {
    var magnitude = Math.sqrt(y*y + x*x);
    var nx = x;
    var ny = y;
    if (magnitude > 0.01) {
        var newMagnitude = joystickFunction(magnitude);
        nx = x/magnitude*newMagnitude;
        ny = y/magnitude*newMagnitude;
    }


    joystick.style.left = nx*joystickStiff + joystickCenterX - joystick.offsetWidth/2+"px";
    joystick.style.top = ny*joystickStiff + joystickCenterY - joystick.offsetHeight/2 +"px";

    dx = nx;
    dy = ny;
}


function joystickAreaTouchListener(event){
    var rect = this.getBoundingClientRect();

    var touch = event.targetTouches[0];

    var x = touch.pageX - rect.left;
    var y = touch.pageY - rect.top;

    moveJoystick(x - joystickCenterX, y - joystickCenterY);

    event.preventDefault();
};


mba.onmouseleave = resetJoystick;


function resetJoystick() {
    moveJoystick(0,0);
}

mba.addEventListener("touchmove", joystickAreaTouchListener , true);
mba.addEventListener("touchstart", joystickAreaTouchListener , true);
mba.addEventListener("touchend", function(event) {
    if (event.targetTouches.length == 0) {
        resetJoystick();
    }
}, true);

