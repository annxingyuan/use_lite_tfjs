console.clear()
d3.select('body').selectAppend('div.tooltip.tooltip-hidden')


async function drawChart(str0, str1){
  embed0 = await window.getEmbedding(str0)
  embed1 = await window.getEmbedding(str1)

  console.log({embed0, embed1})

  var sel = d3.select('#graph').html('')

  var s = 25
  var numX = 32
  var c = d3.conventions({
    sel,
    width: s*numX,
    height: s*512/numX,
    margin: {top: 20, left: 0, bottom: 20, right: 0}
  })

  var boxes = d3.range(512).map(i => {
    var x = s*(i % numX)
    var y = s*(Math.floor(i/numX))

    var e0 = embed0.vec[i]
    var e1 = embed1.vec[i]

    return { i, x, y, e0, e1 }
  })

  var boxSel = c.svg.appendMany('g', boxes)
    .translate(d => [d.x, d.y])

  var p = 3
  boxSel.append('rect').at({width: s - p, height: s - p, stroke: '#eee', fill: 'none'})

  var vecY = d3.scaleLinear().domain([-.07, .07]).range([0, s - p])

  boxSel.append('path')
    .at({
      d: d => 'M' + [0, vecY(d.e0)] + 'L' + [s - p, vecY(d.e1)],
      stroke: '#000',

    })

  drawHeatLine(embed0, d3.select('#heat-line-0'))
  drawHeatLine(embed1, d3.select('#heat-line-1'))

  drawScatter(boxes)

  drawArrival(boxes)
}

function drawArrival(boxes){
  var sel = d3.select('#arrival')

  var c = sel.datum()// && 0

  var transitionDuration = c ? 500 : 0
  // init arrival plot
  if (!c){

    var c = {}

    var width = sel.node().offsetWidth
    var r = width/2
    var height = r

    var svg = sel.html('').append('svg').at({width, height})
      .append('g').translate([r, r])

    var θscale = d3.scaleLinear()
      .domain([0, boxes.length - 1])
      .range([-Math.PI*2, 0])

    x = d3.scaleLinear()
      .domain([-0.06, 0.06])
      .range([-r/1.2, 0])

    var ticks = d3.range([.06, .03, 0, -.03, -0.06])
    var arc = d3.arc().startAngle(-Math.PI / 2).endAngle(Math.PI / 2)
    svg.appendMany('path', ticks)
      .at({
        d: d => arc({innerRadius: x(d) + r, outerRadius: x(d) + r}),
        stroke: d => d == .5 ? '#000' : '#ccc',
        strokeWidth: .5,
      })

    boxes.forEach((d, i) => {
      d.θ = θscale(i)
    })

    var boxSel = svg.appendMany('g', boxes)
      .translate(d => [Math.cos(d.θ)*r, Math.sin(d.θ)*r])
      .call(d3.attachTooltip)
      .append('g')
      .at({transform: d => `rotate(${d.θ*180/Math.PI})`})

    var lineSel = boxSel.append('line')
      .at({ x1: d => x(d.e0), x2: d => x(d.e1), stroke: '#000', strokeWidth: .2 })

    var circle0Sel = boxSel.append('circle')
      .at({r: 1, fill: '#f0f'})
    
    var circle1Sel = boxSel.append('circle')
      .at({r: 1, fill: 'steelblue'})

    c = {lineSel, circle0Sel, circle1Sel, x}
  
    sel.datum(c)
  }

  c.lineSel.data(boxes)
    .transition().duration(transitionDuration)
    .at({ x1: d => c.x(d.e0), x2: d => c.x(d.e1) })

  c.circle0Sel.data(boxes)
    .transition().duration(transitionDuration)
    .at({cx: d => x(d.e0)})

  c.circle1Sel.data(boxes)
    .transition().duration(transitionDuration)
    .at({cx: d => x(d.e1)})

}
  

function drawScatter(boxes){
  var sel = d3.select('#scatter')

  var c = sel.datum()
  // init scatter plot
  if (!c){
    sel.html('')
    var c = d3.conventions({
      sel,
      width: 500,
      height: 500,
      margin: {left: 30}
    })

    c.xAxis.ticks(5)
    c.yAxis.ticks(5)

    c.x.domain([-.07, .07])
    c.y.domain([-.07, .07])

    d3.drawAxis(c)

    c.svg.appendMany('circle', boxes)
      .translate(d => [c.x(d.e0), c.y(d.e1)])
      .at({
        r: 2,
        fillOpacity: .1,
        fill: d => d3.interpolateRainbow(d.i/512),
        stroke: d => d3.interpolateRainbow(d.i/512),
      })

    sel.datum(c)

  } else {
    c.svg.selectAll('circle')
      .data(boxes)
      .transition().duration(1000)
      .translate(d => [c.x(d.e0), c.y(d.e1)])
  }
}

function drawHeatLine(embed, sel){
  var sel = sel.html('')

  var w = 1
  var c = d3.conventions({
    sel,
    height: 10,
    width: 512*w,
    margin: {top: 5, left: 0, bottom: 0, right: 0}

  })

  var normaliseScale = d3.scaleLinear().domain([-.07, .07])
  var colorScale = d => d3.interpolatePuOr(normaliseScale(d))

  c.svg.appendMany('rect', embed.vec)
    .at({
      height: c.height,
      width: w,
      fill: colorScale,
      x: (d, i) => i*w,
    })
}


// only load model on first load
!(async function(){
  if (!window.isLoaded) await window.init()

  window.isLoaded = true

  var str0 = (new URLSearchParams(window.location.search)).get('str0')
  var str1 = (new URLSearchParams(window.location.search)).get('str1')

  if (!str0) str0 = 'The red dog chased the cat.'
  if (!str1) str1 = 'The dog chased the cat.'

  d3.select('#str0').node().value = str0
  d3.select('#str1').node().value = str1

  drawChart(str0, str1)

  d3.select('html').st({opacity: 1})


  // d3.selectAll('#str0,#str1').on('input', function(d, i){

  d3.select(window).on('keydown', () => {
    if (event.keyCode != 32 && event.keyCode != 13) return

    var str0 = d3.select('#str0').node().value
    var str1 = d3.select('#str1').node().value

    var url = '?str0=' + encodeURIComponent(str0) + '&str1=' + encodeURIComponent(str1)

    history.replaceState({}, '' , url)
    drawChart(str0, str1)
  })  


})()

