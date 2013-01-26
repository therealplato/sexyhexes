/*window.requestAnimFrame = (function(){
  return window.requestAnimationFrame       ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame    ||
         window.oRequestAnimationFrame      ||
         window.msRequestAnimationFrame     ||
         function(callback, element){
           window.setTimeout(callback, 1000 / 60);
         };
})();*/

/*var SVG=function(w,h){
 var NS="http://www.w3.org/2000/svg";
 var svg=document.createElementNS(NS,"svg");
 svg.width=w;
 svg.height=h;
 return svg;
};*/

var Sexy = {};
Sexy.grids = []; // one Sexy.grid per layer
//Sexy.msgs=[];
Sexy.Grid = function(x,y,r){
  // This is a grid of vertices... 7 vertices to a hex
  if(arguments.length<3){
    x=400; y=400; r=10; 
  };
  this.r = r;  this.xpx = x;  this.ypx = y;
  this.verts = {}; // to store Vertex objects
  this.hexes=[]; //to store Hex objects to pass to d3

  // Calculate how many hexes of radius r we can squeeze into x*y px:
  var s    = r*Math.sqrt(3)*0.5; // 'Short' radius i.e. center to edge midpoint
  this.rows = Math.floor((y-(r/2))/(1.5*r)); //How many rows fit
  this.cols = Math.floor((x-s)/(2*s)); //How many columns fit (>=1)

  if(this.rows <= 0 || this.cols <= 0){ 
    console.log('No room for even one hex'); return false;
  };

  //this.xpad = Math.floor((x-(2*s*this.cols+s))/2);    //Pixel offset...
  this.ypad = Math.floor((y-(1.5*r*this.rows+0.5*r))/2); //...to center
  this.xpad = 0; 
  //this.ypad = 0;
  // Pick a row and column to place hex origin near near center of container
  this.ho_row = Math.floor(this.rows/2); // the row of the hex origin, zero index
  this.ho_col = Math.floor(this.cols/2); // the col of the hex origin, zero index
  // From here shouldn't it be trivial to iterate across rows and columns?

  // Calculate x and y coordinates of hex origin
  if(this.ho_col % 2 == 0){ // even column [zero indexed from left]
    this.ho_x = this.xpad + s + (2*s*this.ho_col);
  } else {
    this.ho_x = this.xpad + 2*s + (2*s*this.ho_col);
  };
  this.ho_y = this.ypad + r + (1.5*r*this.ho_row); // regardless of row even/odd
  //Start at top left corner and place vertices
  // ho_col >= 0. cols >= 1.
  // Case A: 1x1 grid. a1= 0-1+1 = 0; a2=1-0=1; b = 0-1+1=0
  // Case B: 1x2 grid. a = 1-2+1 = 0; a2=2-1=2; b = 0-1+1=0
  // Case C: 2x2 grid. a = 1-2+1 = 0; b = 1-2+1=0
  // Case D: 2x3 grid. a = 1-3+1 =-1; b = 1-2+1=0
  // Case E: 2x10 grid a1= 5-10+1=-4; a2=10-5=6; b = 1-2+1=0 << -4..5 is 10 steps
  var a1 = this.ho_col-this.cols+1; // leftmost col index on row zero
  var a2 = this.cols+a1;            // rightmost col index+1 on row zero
  var b2 = this.ho_row-this.rows; // bottommost row index-1
  var b1 = this.rows+b2;            // topmost row index
  var nudge = 0;
  // Due to the nudge, we have to start by shifting a1 and a2 right
  var rows_above = b1;
  var prenudge = Math.floor(rows_above/2);
  a1 = a1 + prenudge;
  a2 = a2 + prenudge;

  // OK so now we have the row,col coordinates bounding our grid
  for(var i=b1; i>b2; i--){  // i ~= -(row/2) .. +(row/2)
    for(var j=a1; j<a2; j++){ // j = col
//      var pq = Sexy.rc2pq(i,j); //{p:_,q:_}
// Converting row,col into pq: <p,q> = col * <-1,2> + row * <2,-1>
      var p = (-1*j)+( 2*i);
      var q = ( 2*j)+(-1*i);
      var vert = new Sexy.Vertex(p, q);
      var xy = Sexy.pq2xy(p,q,r);
  // x and y values may be negative. pq2xy returns standard cartesian
// coordinates, where +y is up. SVG expects +y to be down.  
// We will offset them to the center of svg.
//      var w_2 = Math.floor(this.xpx/2);
//      var h_2 = Math.floor(this.ypx/2);
      var x1 = this.ho_x+xy.x;
      var y1 = this.ho_y-xy.y;
      var hex = new Sexy.Hex(vert, x1, y1);
      this.hexes.push(hex);
      //this.setVtx(vert);
    };
    nudge++;
    if(nudge ==2 ){ // Shift columns left every two rows (to alternate)
      a1--;
      a2--;
      //i--;
      nudge=0;
    };
  };
//OK now we know how many rows and colums to make and where to put the origin
//  var a = 0; // Completed rows.
// var b = 0; // Completed cols in a row.
//  var f = 0; // Position of currently placing vertex
//  var g = 0; // (in p,q coords)
//  var flip = false; //false = left; true = right;
//  this.origin = new Sexy.Vertex(0,0,this.ho_x,this.ho_y);
//  this.DOMtag = svg(cfg.xpx, cfg.ypx);
//  this.entities = [];
/*  this.update = function(){
    console.log('Updating');
    this.entities.forEach(function(entity){
      entity.update();
    });
  };*/
  this.setVtx=function(v0){
    var pstr=v0.p.toString(); var qstr=v0.q.toString();
    if(typeof(this.verts[pstr])=="undefined"){ 
      this.verts[pstr] = {};
    }
    this.verts[pstr][qstr] = v0;
  };

  this.getVtx=function(p,q) {
    var pstr=p.toString(); var qstr=q.toString();
    if(typeof(this.verts[pstr])=="undefined"){ 
      this.verts[pstr] = {};
      this.verts[pstr][qstr] = new Sexy.Vertex(p,q);
    } else if (typeof(this.verts[pstr][qstr])=="undefined"){
      this.verts[pstr][qstr] = new Sexy.Vertex(p,q);
    };
    return this.verts[pstr][qstr]; 
  };

  Sexy.grids.push(this);
};

Sexy.pq2xy=function(p0,q0,r) {

    var q_sign = ((q0<0) ?   -1 : 1);
    var hypotenuse = (Math.abs(q0)*r);
    var q_to_x=hypotenuse*Math.cos(Math.PI/6); // hyp * cos = adjacent
    var q_to_y=hypotenuse*Math.sin(Math.PI/6); // Pi/6 rad = 30 degrees

//note even though +p is "up" <canvas> treats +y as down, thus the odd signs
/* Old version:
    if(q_sign==1){  //q component is pointing 2 o clock
        x1=Sexy.xorigin + q_to_x;    
        y1=Sexy.yorigin - (p0*Sexy.r()) - q_to_y;
    } else if (q_sign==-1){  //q component is pointing 8 o clock
        x1=Sexy.xorigin - q_to_x;    
        y1=Sexy.yorigin - (p0*Sexy.r()) + q_to_y;
    } else {console.log("error in vert2xy")};
    return {"x":x1, "y":y1};
*/
    if(q_sign==1){  //q component is pointing 2 o clock
        var x1= q_to_x;    
        var y1= p0*r + q_to_y;
    } else if (q_sign==-1){  //q component is pointing 8 o clock
        var x1= -1*q_to_x;    
        var y1= p0*r - q_to_y;
    } else {console.log("error in pq2xy")};
    return {'x':x1, 'y':y1};
};

Sexy.Vertex = function(p0,q0) {
    this.p=p0;    this.q=q0;    this.theta=null;
    //theta: rotation angle. 0: up/12'ck, Pi/3: 10'ck, Pi: 6'ck 2*Pi: 12'ck
    this.phaseP=((this.p%3)+3)%3;    this.phaseQ=((this.q%3)+3)%3;
    //We have to do modulo twice to handle p|q<0. e.g. (-4)%3 = -1 => (-1+3)%3=2
};

Sexy.Hex = function(v0,x,y){
  this.center = v0;
  this.x = x;
  this.y = y;
  this.data = Math.random();
  if(v0.p == 0 && v0.q == 0){ this.data = 1 };
}


Sexy.hex2path = function(x,y,r){     //x,y center, r radius
  var s = 0.5*Math.sqrt(3)*r; //r' short radius
  var t = 0.5*r;              //half of r
  var z =                     //xy coordinates of the six vertices 
/*
   [[x-r,y  ], [x-t,y+s], [x+t,y+s],  //clockwise 9'ck 11'ck 1'ck...
    [x+r,y  ], [x+t,y-s], [x-t,y-s]];
*/
   [[x  ,y+r], [x+s,y+t], [x+s,y-t],  //clockwise 12'ck 2'ck 4'ck...
    [x  ,y-r], [x-s,y-t], [x-s,y+t]];

  var path="";
  path+=("M"+z[0][0]+" "+z[0][1]+" ");
  for(i=1;i<6;i++){
    path+=("L"+z[i][0]+" "+z[i][1]+" ");
  }
  path+=("Z");
  return path;
};


  
/*Sexy.tick = function(){
  Sexy.ticking = true;
  var msg = Sexy.msgs.shift();
  if(msg){console.log(msg)};
  window.setTimeout(Sexy.tick, 1000);
};

Sexy.asyncSetup=function(str,callback){
  console.log('timeout');
  window.setTimeout(
  (function(a,b){    
    return function(){
      var foo = new Sexy.grid();
      console.log(JSON.stringify(foo,null,2));
      console.log('timein');
      b(null);
    };
  })(str,callback)
  , 1000);
};

Sexy.init=function(){
//  Sexy.clock.start()
  Sexy.asyncSetup('hello', function(err){
    if(!err) { 
//      Sexy.tick();
      requestAnimFrame(function(time){
        Sexy.grids[0].update();
//        Sexy.draw();
      });
    } else { 
      console.log(err)
    };
  });
};
*/
//document.addEventListener('DOMContentLoaded', Sexy.init, false);

