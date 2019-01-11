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






function render(setSort){
  lines.forEach((d, i) => {
    d.pi = Math.floor(i/2)
  })

  pairs = d3.nestBy(lines, d => d.pi)
    .filter(d => d.length == 2)

  pairs.forEach((pair, pairIndex) => {
    pair.vec = d3.range(512).map(i => {
      var a = pair[0].vec[i]
      var b = pair[1].vec[i]
      var diff = a - b

      return {a, b, diff, i, pair}
    })

    pair.color = d3.interpolateRainbow(pairIndex/6.5) 
  })

  // only pick direction and sort on with the starting set of pairs
  if (setSort){
    meanDiff = d3.range(512)
      .map(i => {
        var mean = d3.mean(pairs, d => d.vec[i].diff)
        var isFlip = mean < 0

        if (isFlip){
          mean = -mean
        }

        return {i, mean, isFlip}
      })
  } else {

  }

  meanDiff.forEach(({i, isFlip}) => {
    if (isFlip) pairs.forEach(d => {
      d.vec[i].a = -d.vec[i].a
      d.vec[i].b = -d.vec[i].b
      d.vec[i].diff = -d.vec[i].diff
    })
  })


  meanDiff = _.sortBy(meanDiff, d => -d.mean)
  pairs.forEach(pair => {

    pair.vec = d3.permute(pair.vec, meanDiff.map(d => d.i))

    pair.vec.forEach((d, i) => d.i = i)
  })


  var sel = d3.select('#sentences').html('')

  sel.append('div')
    .appendMany('div.pair', pairs)
    .on('mouseover', pair => {
      d3.selectAll('.pair-line')
        .st({opacity: .5})
        .classed('active', d => d.pair == pair)
        .filter(d => d.pair == pair)
        .raise()
    })
    .st({color: d => d.color})
    .append('div.sentence').text(d => d[0].str)
    .parent()
    .append('div.sentence').text(d => d[1].str)


  boxes = d3.nestBy(_.flatten(pairs.map(d => d.vec)), d => d.i)

  drawBoxLine(boxes, d3.select('#box-line').html(''))
  drawBoxBar(boxes, d3.select('#box-bar').html(''))
} 




function drawBoxLine(boxes, sel){
  var s = 25
  var numX = 32
  var c = d3.conventions({
    sel,
    width: s*numX,
    height: s*512/numX,
    margin: {top: 20, left: 0, bottom: 20, right: 0}
  })

  boxes.forEach(d => {
    i = +d.key

    d.x = s*(i % numX)
    d.y = s*(Math.floor(i/numX))
  })

  console.log(boxes[0])

  var boxSel = c.svg.appendMany('g', boxes)
    .translate(d => [d.x, d.y])

  var p = 3
  boxSel.append('rect').at({width: s - p, height: s - p, stroke: '#eee', fill: 'none'})

  var vecY = d3.scaleLinear().domain([-.07, .07]).range([0, s - p])

  boxSel.appendMany('path.pair-line', d => d)
    .at({
      d: d => 'M' + [0, vecY(d.a)] + 'L' + [s - p, vecY(d.b)],
      stroke: d => d.pair.color,
      opacity: 1
    })
}

function drawBoxBar(boxes, sel){
  var s = 25
  var numX = 32
  var c = d3.conventions({
    sel,
    width: s*numX,
    height: s*512/numX,
    margin: {top: 20, left: 0, bottom: 20, right: 0}
  })

  boxes.forEach(d => {
    i = +d.key

    d.x = s*(i % numX)
    d.y = s*(Math.floor(i/numX))
  })

  console.log(boxes[0])

  var boxSel = c.svg.appendMany('g', boxes)
    .translate(d => [d.x, d.y])

  var p = 3
  boxSel.append('rect').at({width: s - p, height: s - p, stroke: '#eee', fill: 'none'})

  var vecY = d3.scaleLinear().domain([.12, -.12]).range([0, s - p])

  var xSpace = Math.floor((s - 5)/pairs.length)

  boxSel.appendMany('path.pair-line', d => d)
    .at({
      d: (d, i) => 'M' + [xSpace*i + 2.5, vecY(0)] + 'V' + vecY(d.diff),
      stroke: d => d.pair.color,
      strokeWidth: xSpace/2,
      opacity: 1
    })
}





// only load model on first load
!(async function(){
  if (!window.isLoaded) await window.init()


  var rawLines = [
    'She played soccer every week.',
    'She plays soccer every week.',
    'He was juggling.',
    'He is juggling.',
    'They had won three games.',
    'They have won three games.',
    'The dog chased the cat.',
    'The dog chases the cat.',

    // 'I ran to the park.',
    // 'I joggged to the park.'
  ]

  // var rawLines = [
  //   'i liked the movie',
  //   'i enjoyed the movie',
  //   'i loved the movie',
  //   'i disliked the movie',
  //   'i hated the movie',
  //   'i loathed the movie',
  // ]

  for (line of rawLines){
    await addLine(line)
  }

  render(true)

  // await addLine('I ran to the park.')
  // await addLine('I jogged to the park.')
  // render()

  // await addLine('I jog to the park.')
  // await addLine('I jogged to the park.')
  // render()

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


