sexyhexes
=========

hex grid library for nodejs/browser
Browser creates one object 'Sexy' for namespacing
Sexy.vtx: {p,q,grid}
Sexy.hex: {vtx,data} 
Sexy.grid: {hexes:[]}
an object representing a plane of hex objects

Usage ideas:
Somebody wants to put JSON data into a hex map using Sexy
<script src='Sexyhexes.js'>...
<script>
var svg = d3.select("body").append("svg")
  .attr("width", 200)
  .attr("height", 200);

var grid = Sexy.grid(200,200,10);

svg.selectAll('.hex')
  .data(grid.hexes)
  .enter().append('path')
    .attr('d',function(d){ return Sexy.hex2path(d.x, d.y, grid.hexes.r) })
    .attr('class','hex')
    .on('click', function(d){alert('hi')});
      

