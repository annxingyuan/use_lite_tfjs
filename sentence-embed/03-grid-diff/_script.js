console.clear()
d3.select('body').selectAppend('div.tooltip.tooltip-hidden')


var lines = []
async function addLine(str0){
  embed0 = await window.getEmbedding(str0)
  lines.push(embed0)
  console.log('added ', str0)

  // absdiff = d3.range(512)
  //   .map(i => Math.abs(a.vec[i] - embed0.vec[i]))

  // var newRowSel = d3.select('#lines').append('div.fragment-row')
  // drawHeatLine(absdiff, newRowSel.append('div.heat'))
  // newRowSel.append('div').text(str0)
}

function removeLine(str){
  lines = lines.filter(d => d.str != str)
}



function distL1(a, b){
  return d3.sum(d3.range(512).map(i => {
    var dif = a[i] - b[i]
    return Math.abs(dif)
  }))
}

function distL2(a, b){
  return d3.sum(d3.range(512).map(i => {
    var dif = a[i] - b[i]
    return dif*dif
  }))
}

function distCosin(a, b){
  return dot(a, b)/(mag(a)*mag(b))
}

function distAngular(a, b){
  var φ = distCosin(a, b)

  return 1 - Math.acos(φ)/Math.PI
}

function dot(a, b){
  return d3.sum(d3.range(512).map(i => a[i]*b[i]))
}

function mag(a){
  return Math.sqrt(dot(a, a))
}



function render(){
  lines.forEach((d, i) => d.i = i)

  drawGrid()

  drawGridSimple(d3.select('#grid-l1'), distL1)
  drawGridSimple(d3.select('#grid-l2'), distL2)
  drawGridSimple(d3.select('#grid-cos'), distCosin)
  drawGridSimple(d3.select('#grid-angular'), distAngular)

  d3.selectAll('.line-label')
    .st({cursor: 'pointer'})
    .on('click', d => {
      removeLine(d.str)
      render()
    })
}

function drawGrid(){

  var numX = 23
  var p = 2   // pixel size of chart item
  var s = (numX + 2)*p // grid size of pair
  var sel = d3.select('#grid').html('')
    .st({
      position: 'relative',
      height: s*(lines.length + 1),
      marginLeft: s,
      marginBottom: 150,
    })


  sel.appendMany('div.line-label', lines)
    .st({position: 'absolute'})
    .translate(d => [d.i*s + s/2, s*lines.length])
    .append('div')
    .st({transform: 'rotate(45deg)', transformOrigin: 'left top', fontSize: 12})
    .text(d => d.str)

  sel.appendMany('div.line-label', lines)
    .st({position: 'absolute'})
    .translate(d => [s*lines.length + 5, d.i*s + s/4])
    .append('div')
    .st({fontSize: 12})
    .text(d => d.str)
    .on('click', d => console.log(d) && removeLine(d.str))



  var pairs = d3.cross(lines, lines)
    // .filter(([a, b]) => a != b)
    // .filter(([a, b]) => lines.length - 1 - a.i <= b.i)

  var pairSel = sel.appendMany('div', pairs)
    .translate(([a, b]) => [a.i*s, b.i*s])
    .st({background: '#fff', width: s - 1, height: s - 1, position: 'absolute'})
    .each(drawPair)


  function drawPair([a, b]){
    var sel = d3.select(this).append('div')

    var c = d3.conventions({
      sel,
      totalHeight: (numX + 1)*p,
      totalWidth: (numX + 1)*p,
      margin: {top: 0, left: 0, bottom: 0, right: 0},
      layers: 'c'
    })

    var [ctx] = c.layers

    var normaliseScale = d3.scaleLinear().domain([0, .1])

    d3.range(512).forEach(i => {
      var x = p*(i % numX)
      var y = p*(Math.floor(i/numX))

      var v = Math.abs(a.vec[i] - b.vec[i])

      ctx.beginPath()
      ctx.fillStyle = d3.interpolateOranges(normaliseScale(v))
      ctx.rect(x, y, p, p)
      ctx.fill()
    })
  }
}

function drawGridSimple(sel, metric){
  var numX = 23
  var p = 2   // pixel size of chart item
  var s = (numX + 2)*p // grid size of pair
  sel
    .html('')
    .st({
      position: 'relative',
      height: s*(lines.length + 1),
      marginLeft: s,
      marginBottom: 200,
    })

  sel.appendMany('div.line-label', lines)
    .st({position: 'absolute'})
    .translate(d => [d.i*s + s/2, s*lines.length])
    .append('div')
    .st({transform: 'rotate(45deg)', transformOrigin: 'left top', fontSize: 12})
    .text(d => d.str)

  sel.appendMany('div.line-label', lines)
    .st({position: 'absolute'})
    .translate(d => [s*lines.length + 5, d.i*s + s/4])
    .append('div')
    .st({fontSize: 12})
    .text(d => d.str)

  var pairs = d3.cross(lines, lines)
    // .filter(([a, b]) => a != b)


  pairs.forEach(d => {
    d.v = metric(d[0].vec, d[1].vec)
    if (isNaN(d.v)) d.v = 1
  })

  var normaliseScale = d3.scaleLinear().domain(d3.extent(pairs, d => d.v))
  var pairSel = sel.appendMany('div', pairs)
    .translate(([a, b]) => [a.i*s, b.i*s])
    .st({background: '#fff', width: s - 1, height: s - 1, position: 'absolute'})
    .each(drawPair)


  function drawPair(d){
    var sel = d3.select(this).append('div')

    var c = d3.conventions({
      sel,
      totalHeight: (numX + 1)*p,
      totalWidth: (numX + 1)*p,
      margin: {top: 0, left: 0, bottom: 0, right: 0},
      layers: 'cs'
    })

    var [ctx, svg] = c.layers


    ctx.beginPath()
    ctx.fillStyle = d3.interpolateOranges(normaliseScale(d.v))
    ctx.rect(0, 0, p*numX, p*numX)
    ctx.fill()

    svg.append('text')
      .text(d3.format('.2f')(d.v))
      .at({
        fontSize: 12,
        textAnchor: 'middle',
        x: p*numX/2,
        y: p*numX/2,
        dy: '.33em',
        fill: '#000'
      })


  }
}



function drawHeatLine(vec, sel){
  var sel = sel.html('')

  var w = 1
  var c = d3.conventions({
    sel,
    height: 25,
    width: 512*w,
    margin: {top: 0, left: 0, bottom: 2, right: 10}
  })

  var normaliseScale = d3.scaleLinear().domain([0, .1])
  var colorScale = d => d3.interpolateOranges(normaliseScale(d))

  c.svg.appendMany('rect', vec)
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


  var rawLines = [
    'I like my new phone',
    'Your cell phone looks great.',
    'Will it snow tomorrow?',
    'Hurricanes have hit the us',
    'How old are you?',
    'What is your name?'
  ]

  // var rawLines = [
  //   'She played soccer every week.',
  //   'She plays soccer every week.',
  //   'He was juggling.',
  //   'He is juggling.',
  //   'The dog chased the cat.',
  //   'The dog chases the cat.',
  //   'He adjusted his knapsack.',
  //   'He adjusts his knapsack.',
  //   'I watched the ball.',
  //   'AVG DIFF FROM WATCHED',
  //   'I watch the ball.',
  //   'I saw the ball.',
  //   'I shown the ball.',
  //   'I watching the ball.',
  // ]

  for (line of rawLines){
    await addLine(line)
  }

  if (rawLines.includes('AVG DIFF FROM WATCHED')){
    watchedLine = lines.filter(d => d.str == 'I watched the ball.')[0]
    diffLine = lines.filter(d => d.str == 'AVG DIFF FROM WATCHED')[0]

    d3.range(512).forEach(i => {
      diffLine.vec[i] = watchedLine.vec[i] - meanDiff[i].rawMean 
    })
  }



  render()

  window.isLoaded = true

  d3.select('html').st({opacity: 1})

  d3.select(window).on('keydown', async () => {
    if (event.keyCode != 13) return

    var str0 = d3.select('#str0').node().value

    // var url = '?str0=' + encodeURIComponent(str0) + '&str1=' + encodeURIComponent(str1)

    // history.replaceState({}, '' , url)
    await addLine(str0)

    render()
  })  


})()


