console.clear()
d3.select('body').selectAppend('div.tooltip.tooltip-hidden')


var lines = []
async function addLine(str0, str1){
  embed0 = await window.getEmbedding(str0)


  var prevEmbed = _.last(lines) || embed0
  lines.push(embed0)

  absdiff = d3.range(512).map(i => Math.abs(prevEmbed.vec[i] - embed0.vec[i]))


  var newRowSel = d3.select('#graph').append('div.fragment-row')
  drawHeatLine(absdiff, newRowSel.append('div.heat'))
  newRowSel.append('div').text(str0)
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

  window.isLoaded = true

  // drawChart(str0)

  d3.select('html').st({opacity: 1})

  // d3.selectAll('#str0,#str1').on('input', function(d, i){

  d3.select(window).on('keydown', () => {
    if (event.keyCode != 32 && event.keyCode != 13) return

    var str0 = d3.select('#str0').node().value

    // var url = '?str0=' + encodeURIComponent(str0) + '&str1=' + encodeURIComponent(str1)

    // history.replaceState({}, '' , url)
    addLine(str0)
  })  


})()


