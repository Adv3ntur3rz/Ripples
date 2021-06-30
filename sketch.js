/*
CP1 final

the ripples

TODO:

-make more notes

*/

//ripple related
let ripples; // an array to hold the ripples
let deadRipples; //an array to hold the values of dead ripples


//audio variables
let notesA = []; //an array to hold a bunch of notes
let reverb; //some audio devices reverb

//timing variables
let tick, prevTime;

//control variables
let overlay; // to have an initial overlay before starting
let maxMag; // maximum magnitude
let speed; // speed of the ripples (how many pixels per tick it moves)
let maxHistory; // maximum amount of dead ripples to display

//input related variables
let lastClick; // we don't want people to tap too often

let colors = [255, 89, 230,
  89, 255, 211,
  66, 142, 255,
  216, 245, 54,
  247, 245, 119,
  28, 235, 200,
  63, 29, 143,
  250, 155, 204,
  215, 250, 155
];

let linesColor;

class Ripple {

  /* x position,
  y position,
  magnitude: percentage of a "full size" (0-10,0 to 2 * width)
  order: how many more ripples can this ripple create
  */
  constructor(x, y, magnitude, order) {
    //ID

    //position
    this.x = x;
    this.y = y;
    this.trueMagnitude = map(magnitude, 0, 10, 0, maxMag);
    this.order = order;
    this.size = 0;

    //control
    this.finished = false;
    this.tickUpdated = false; // this is to update the tick once and only once
    this.gone = false;
    this.spawned = false;

    //color/graphics
    this.r = floor(random(0, colors.length / 3));
    this.color = [colors[this.r], colors[this.r + 1], colors[this.r + 2]];
    this.ringCount = floor(magnitude * 0.75);

    //audio
    var note = int(random(0,17));
    notesA[note].pan(map(this.x, 0, width, -0.8, 0.8), 0.75);
    notesA[note].amp(map(magnitude, 0, 10, 0, 1), 0.1);
    notesA[note].play();

  }

  //update the size of the ripple
  update() {
    //draw the circle
    this.display();

    //check size is less than a certain magnitude, if so continue changing the size
    if (this.size < this.trueMagnitude) {
      this.size += speed;
    }
    else if(!this.gone){

      this.finished = true;

      //update the tick for the fade away animation
      if (!this.tickUpdated) {
        this.finishedTick = tick;
        this.tickUpdated = true;
      }

      if (tick - this.finishedTick < 25) {
        this.size += speed * 1.3;
      } else {

        this.gone = true;

        //add these values to the dead ripple array
        deadRipples.push(this.x);
        deadRipples.push(this.y);
        deadRipples.push(this.size);
        deadRipples.push(this.r);

        //check for a new spawn
        if(this.order > 0) {
          this.spawn();
        }
      }
    }
  }

  //display the circle
  display() {

    if (!this.finished) {
      fill(255);
      noStroke();
      circle(this.x, this.y, 4);

      noFill();
      strokeWeight(10);


      for (var count = 0; count < this.ringCount; count++) {
        if (this.size - (this.trueMagnitude / this.ringCount * count) > 0) {
          stroke(this.color[0], this.color[1], this.color[2], map(count, 0, this.ringCount, 100, 255));
          circle(this.x, this.y, this.size - (this.trueMagnitude / this.ringCount * count));
        }
      }

    } else {

      if (tick - this.finishedTick < 25) {

        for (var count2 = 0; count2 < this.ringCount; count2++) {
          var fadeAmount = map(tick - this.finishedTick, 0, 25, map(count2, 0, this.ringCount, 100, 255), 0);
          strokeWeight(map(tick - this.finishedTick, 0, 25, 10, 1));

          if (this.size - (this.trueMagnitude / this.ringCount * count2) > 0) {
            noFill();
            stroke(this.color[0], this.color[1], this.color[2], fadeAmount);
            circle(this.x, this.y, this.size - (this.trueMagnitude / this.ringCount * count2));
          }

        }
      }
    }


  }

  getPos(){
    return createVector(this.x, this.y);
  }

  get isGone() {
    return this.gone;
  }

  spawn(){

    if(!this.spawned){

      var A = random(-this.size/2, this.size/ 2);
      var B = sqrt(sq(this.size / 2) - sq(A));

      //for pos|neg y
      var dir = 0;
      if(random(0,1) > 0.5){
        dir = 1;
      }else{
        dir = -1;
      }

      var newX = A + this.x;
      var newY = this.y + B * dir;

      if(newX > width) newX = width;
      if(newX < 0) newX = 0;

      if(newY > height) newY = height;
      if(newY < 0) newY = 0;

      ripples.push(new Ripple(newX,
                              newY,
                             map(this.trueMagnitude, 0, maxMag,0, 10) - random(1,3),
                             this.order-1));
      this.spawned = true;
    }
  }
}


function preload(){


  soundFormats("wav");
  for(var i = 1; i < 18; i++){
    if(i < 10)notesA.push(loadSound("sounds/NoteA_0" + i+ ".wav"));
    if(i >= 10)notesA.push(loadSound("sounds/NoteA_" + i+ ".wav"));
  }

  reverb = new p5.Reverb();
  reverb.drywet(0.8);

  for(var k = 0; k < notesA.length; k++){
    reverb.process(notesA[k], 6, 2);
  }

}
function setup() {
  noCursor();
  createCanvas(windowWidth, windowHeight);



  ripples = [];
  deadRipples = [];

  tick = 0;
  prevTime = millis();

  //control variables
  maxMag = width * 0.65;
  speed = width * 0.005;
  overlay = true;
  maxHistory = 15;


  textFont("Georgia");
  textAlign(CENTER);

  lastClick = 0;
  var a = int(random(0, colors.length - 1));
  linesColor = color(colors[a], colors[a + 1], colors[a+ 2], 16);
}

function draw() {
  backdrop();

  lines();
  blendMode(BLEND);
  //update the tick
  if (millis() > prevTime + 10) {
    prevTime = millis();
    tick++;
  }


  //are there ripples? then figure stuff out
  if (ripples.length > 0) {
    for (var i = 0; i < ripples.length; i++) {

      // update the ripples
      ripples[i].update();

      //removed finished ripples
      if (ripples[i].isGone == true) {
        ripples.splice(i, 1);
      }
    }
  }

  if (overlay) {
    noStroke();
    fill(0, 100);
    rect(0, 0, width, height);
    textSize(width / 32);
    fill(255);
    text("Click on the screen to create ripples", width / 2, height / 2);
  } else {
    if (tick < 20) {
      noStroke();
      fill(0, map(tick, 0, 20, 100, 0));
      rect(0, 0, width, height);
      textSize(width / 32);
      noStroke();
      fill(255, map(tick, 0, 20, 255, 0));
      text("Click on the screen to create ripples", width / 2, height / 2);
    }
  }


  //cursor
  if(overlay){
    fill(255);
    noStroke();
    circle(mouseX, mouseY, 3);
  }else{

    fill(255);
    noStroke();
    circle(mouseX, mouseY, 3);


    noFill();
    strokeWeight(2);
    stroke(100);
    strokeCap(ROUND);

    push();
      translate(mouseX, mouseY);
      rotate(radians(tick *2.5));
      arc(0,0, width *0.01, width *0.01, radians(0), radians(270));
    pop();

     push();
      translate(mouseX, mouseY);
      rotate(radians(tick * -2.5));
      arc(0,0, width *0.02, width *0.02, radians(0), radians(300));
    pop();

    push();
      translate(mouseX, mouseY);
      rotate(radians(tick * 2.5));
      arc(0,0, width *0.03, width *0.03, radians(0), radians(330));
    pop();



  }

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  if (overlay) {
    overlay = false;
    tick = 0;
    ripples.push(new Ripple(width / 2, height / 2, 5, 0));
  } else {
    //make a ripple

    if (tick - lastClick > 20) {
      ripples.push(new Ripple(mouseX, mouseY, random(5, 10), 3));
      lastClick = tick;
    }
  }
}

function touchStarted(){
  if (overlay) {
    overlay = false;
    tick = 0;
    ripples.push(new Ripple(width / 2, height / 2, 5, 0));
  } else {
    //make a ripple

    if (tick - lastClick > 20) {

      for(var i = 0; i < touches.length; i++){
        ripples.push(new Ripple(touches[i].x, touches[i].y, random(5, 10), 3));
        lastClick = tick;
      }

    }
  }
}


//reactive backdrop
function backdrop(){
  blendMode(BLEND);
  background(20);


  if(deadRipples.length > 0 && deadRipples.length / 4 < maxHistory){
    for(var i = 0; i < deadRipples.length; i += 4){
      noStroke();
      var r = deadRipples[i + 3];
      fill(colors[r], colors[r + 1], colors[r + 2], 10);
      circle(deadRipples[i], deadRipples[i + 1], deadRipples[i + 2]);
      blendMode(HARD_LIGHT);
    }
  } else if(deadRipples.length / 4 >= maxHistory){

    for(var k = deadRipples.length - (4 * maxHistory); k < deadRipples.length; k += 4){
      var r2 = deadRipples[k + 3];
      noStroke();
      fill(colors[r2], colors[r2 + 1], colors[r2 + 2], 10);
      circle(deadRipples[k], deadRipples[k + 1], deadRipples[k + 2]);
      blendMode(HARD_LIGHT);
    }
  }

  blendMode(BLEND);
  fill(0, 150);
  rect(0, 0, width, height);
}


function lines(){
  if(ripples.length >= 2){
    noFill();
    stroke(linesColor);
    strokeJoin(ROUND);
    strokeCap(ROUND);
    strokeWeight(4);
    beginShape();
    for(var i = 0; i < ripples.length; i++){
      vertex(ripples[i].getPos().x, ripples[i].getPos().y);
    }
    endShape();
  }
}
