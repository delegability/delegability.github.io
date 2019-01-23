var plotGrid = {
  axisTop: {height:10},
  axisBottom: {height:80},
  axisLeft: {width:80},
  margin:{top:15, bottom:0, left:15, right:0},
  rows: [
    { factor:null, component:null, hasAxisTop:true, hasAxisBottom:false,
      topPos:null, height:null, plotHeight:null,
      yScale:d3.scaleLinear() },
    { factor:null, component:null, hasAxisTop:false, hasAxisBottom:false,
      topPos:null, height:null, plotHeight:null,
      yScale:d3.scaleLinear() },
    { factor:null, component:null, hasAxisTop:false, hasAxisBottom:true,
      topPos:null, height:null, plotHeight:null,
      yScale:d3.scaleLinear() },
  ],
  cols: [
    { factor:null, component:null, hasAxisLeft:true,
      leftPos:null, width:null, plotWidth:null, xScale:d3.scaleLinear() },
    { factor:null, component:null, hasAxisLeft:true,
      leftPos:null, width:null, plotWidth:null, xScale:d3.scaleLinear() },
    { factor:null, component:null, hasAxisLeft:false,
      leftPos:null, width:null, plotWidth:null, xScale:d3.scaleLinear() },
  ]
}

var plotview = {
  data: null,
  selected: null,
  margin: { top: 20, right: 210, bottom: 50, left: 70 },
  outerWidth: 900,
  outerHeight: 900,
  width: 0,
  height: 0,
  jitterscales: {current:8, flat:8, indiv:1.5},

  components: [
    {key:'label', name:'Delegability', display:true, factor:0},
    {key:'t_machine_ability', name:'Machine Ability', display:true, factor:1},
    {key:'t_process', name:'Process', display:true, factor:1},
    {key:'t_values', name:'Value Alignment', display:true, factor:1},
    {key:'d_abilities', name:'Human Abilities', display:true, factor:2},
    {key:'d_effort', name:'Effort Required', display:true, factor:2},
    {key:'d_expertise', name:'Expertise Required', display:true, factor:2},
    {key:'s_creativity', name:'Creative Skills Req', display:true, factor:2},
    {key:'s_social_skills', name:'Social Skills Req', display:true, factor:2},
    {key:'r_accountable', name:'Accountability', display:true, factor:3},
    {key:'r_impact', name:'Impact', display:true, factor:3},
    {key:'r_uncertainty', name:'Uncertainty', display:true, factor:3},
    {key:'m_important', name:'Utility', display:false, factor:4},
    {key:'m_intrinsic', name:'Intrinsic', display:false, factor:4},
    {key:'m_learning', name:'Learning Goal', display:false, factor:4} ],
  factors: [
    //{name:"Delegability", c:'#AED6F1', components: [0]},
    {name:"Trust",        c:'#ABEBC6', components: [1, 2, 3]},
    {name:"Difficulty",   c:'#FAD7A0', components: [4, 5, 6, 7, 8]},
    {name:"Risk",         c:'#F9E79F', components: [9, 10, 11]},
    {name:"Motivation",   c:'#F5B7B1', components: [12, 13, 14]} ],

  flatten: true,
  jitter: true,
  colors: []
}

/*****************************************************************/
/* FUNCTIONS */
/*****************************************************************/
/* clear plot data index selection */
function clearSelection() {
  if(plotview.selected) {
    for(var i = 0; i < plotview.selected.length; i++) {
        plotview.selected[i] = false;
    }
  }
}

function getLabelColor(val) {
  var color ='#000';
  if(+val) {
    var num = ((+val - 1) / 3.0);
    //color = d3.interpolategreens(num);
    //color = d3.interpolaterdbu(num);
    //color = d3.interpolateRdBu(num);
    color = d3.interpolatePlasma(num);
  }

  return color;
}

function jitter() {
  if(plotview.jitter) {
    return (Math.random() - 0.5) / plotview.jitterscales.current;
  } else {
    return 0;
  }
}

function loadData(dataset) {
  /* update text in menu */
  $('#datasetMenu button').html(dataset.name);

  /* if no data, load; else, use stored data */
  if(dataset.data == null) {
    d3.csv(dataset.path, function(e, d) {
        loadDataCallback(e, d, dataset) } );
  } else {
    loadDataCallback(null, dataset.data, dataset);
  }
}

/* This function takes the raw data from the CSV and transforms it
 * into a more useful form, grouping responses */
function loadDataCallback(error, rawdata, dataset) {
  if (error) throw error;
  if (!dataset.data) {
    dataset.data = rawdata;
  }

  // create the plots!
  datasets.active = dataset;
  processData(rawdata, plotview.flatten);
  drawAllPlots(true, false);
}

/* transform data to conform to current table view */
function processData(data, flatten) {
  // flatten or not? transform data
  if(flatten) {
    data = d3.nest()
        .key(function(d) { return d.task; })
        // rollup: replace indiv records within group by one record
        .rollup(function(d) {
          retval = {}
          for (i = 0; i < plotview.components.length; i++) {
            attr = plotview.components[i].key;
            retval[attr] = d3.mean(d, function(dd) {
              return dd[attr];
            });
          }
          return retval;
        })
        .entries(data);
  }

  plotview.data = data;
  if(!plotview.selected) {
    plotview.selected = new Array(plotview.data.length);
  }
  clearSelection();
}

function drawAllPlots(redraw, syncSelection) {
  var data = plotview.data;
  // lay out grid. figure out how many valid plots we have
  var numRows = 0;
  for(var i = 0; i < plotGrid.rows.length; i++) {
    if(plotGrid.rows[i].component || plotGrid.rows[i].factor) {
        numRows++;
    }
  }

  if(redraw) {
    // create svg, used for all plots
    var svg = d3.select('#plotContainer svg')
        .remove()
    var svg = d3.select('#plotContainer')
        .append("svg")
        .attr("width", plotview.outerWidth)
        .attr("height", plotview.outerHeight);
  }

  for(var rowi = 0; rowi < numRows; rowi++) {
    for(var coli = plotGrid.cols.length - numRows; coli < (plotGrid.cols.length - rowi); coli++) {
      var row = plotGrid.rows[rowi];
      var col = plotGrid.cols[coli];
      if(redraw) {
        // calculate plot dimensions
        row.plotHeight = (plotview.outerHeight - 3*plotGrid.margin.top -
            plotGrid.axisBottom.height - plotGrid.axisTop.height) / numRows;
        row.height = row.plotHeight;
        if(row.hasAxisBottom) { row.height += plotGrid.axisBottom.height; }
        if(row.hasAxisTop) { row.height += plotGrid.axisTop.height; }
        if(rowi == 0) {
          row.topPos = 0;
        } else {
          var prevRow = plotGrid.rows[rowi-1];
          row.topPos = prevRow.topPos + prevRow.height;
        }
        row.topPos += plotGrid.margin.top;

        // column dimensions:
        col.plotWidth = (plotview.outerWidth - 3*plotGrid.margin.left - plotGrid.axisLeft.width) / numRows;
        col.width = col.plotWidth;
        if(col.hasAxisLeft) { col.width += plotGrid.axisLeft.width; }
        if(coli == 0) {
          col.leftPos = 0;
        } else {
          var prevCol = plotGrid.cols[coli-1];
          col.leftPos = prevCol.leftPos + prevCol.width;
        }
        col.leftPos += plotGrid.margin.left;

        drawPlot(data, row, rowi, col, coli);
      } else {
        updatePlot(data, row, rowi, col, coli, syncSelection);
      }
    }
  }
}

function updatePlot(data, row, row_i, col, col_i, syncSelection) {
  var x_attr = (col.component) ? col.component : col.factor;
  var y_attr = (row.component) ? row.component : row.factor;
  var x_scale = col.xScale;
  var y_scale = row.yScale;

  var plot_id = "plot-" + row_i + "-" + col_i;
  var svg = d3.select('#plotContainer svg #' + plot_id);
  if(!syncSelection) {
    /* update positional transitions, e.g. from jitter */
    svg.selectAll("circle.datapoint")
        .data(data) // bind data
        .transition()
        .duration(200)
        .attr("cx", function(d) { 
          //var v = fval(d, x_attr) + jitter();
          var v = aval(d, x_attr) + jitter();
          return x_scale(v); 
        })
        .attr("cy", function(d) { 
          var v = aval(d, y_attr) + jitter();
          return y_scale(v);
        })
        .attr("r", 5)
        .style("fill", function(d) { 
          return getLabelColor(fval(d, 'label'));
        });
} else {
  /* update selection display */
  /* handle remove selection */
  svg.selectAll("circle.datapoint.selectedCircle")
      .filter(function(d, i) { 
          return !plotview.selected[i];
      })
      .attr("r", 5)
      .style("stroke-width", "1px")
      .classed("selectedCircle", false);
  /* add selection */
  svg.selectAll("circle.datapoint")
      .filter(function(d, i) { 
          return plotview.selected[i];
      })
      .attr("r", 9)
      .style("stroke", "black")
      .style("stroke-width", "2px")
      .classed("selectedCircle", true);
  }
}

function startBounceDatapoint(bounceData, bounceI) {
  /* color red and make bigger */
  var svg = d3.select('#plotContainer svg');
  svg.selectAll("circle")
    .filter(function(d, i) {
        return (taskVal(d) === taskVal(bounceData));
    })
    .attr("r", 17)
    .style("stroke", "red")
    .style("stroke-width", "2px")
    .transition()
    .ease(d3.easeBounce)
    .duration(1000)
    .attr("r", 9);
}

function updateDatapoint(updateData, updateI) {
  var svg = d3.select('#plotContainer svg');
  svg.selectAll("circle")
    .filter(function(d, i) {
        //return (i == updateI);
        return (taskVal(d) === taskVal(updateData));
    })
    .interrupt()
    .attr("r", function(d, i) {
        return (plotview.selected[updateI]) ? 9 : 5;
    })
    .style("stroke-width", function(d, i) {
        return (plotview.selected[updateI]) ? "2px" : "1px";
    })
    .style("stroke", "black")
}

function drawPlot(data, row, row_i, col, col_i) {
  var x_attr = (col.component) ? col.component : col.factor;
  var y_attr = (row.component) ? row.component : row.factor;
  //var x_attr = col.component.key;
  //var y_attr = row.component.key;
  var x_ext = [0.5, 5.5];
  var y_ext = [0.5, 5.5];
  if(plotview.flatten) {
      x_ext = d3.extent(data, function(d) { return aval(d, x_attr); });
      x_ext[0] -= (2 / plotview.jitterscales.flat);
      x_ext[1] += (2 / plotview.jitterscales.flat);
      y_ext = d3.extent(data, function(d) { return aval(d, y_attr); });
      y_ext[0] -= (2 / plotview.jitterscales.flat);
      y_ext[1] += (2 / plotview.jitterscales.flat);
  }
  col.xScale = col.xScale.range([0, col.plotWidth]).domain(x_ext);
  row.yScale = row.yScale.range([row.plotHeight, 0]).domain(y_ext);

  var plot_id = "plot-" + row_i + "-" + col_i;
  var svg = d3.select('#plotContainer svg')
      .append("g")
      .attr("id", plot_id)
      .attr("transform", "translate(" + col.leftPos + "," + (row.topPos + plotGrid.margin.top) + ")")

  // vars to deal with shifting plots due to axes
  var plotShiftRight = 0; // shift due to left axis
  var plotShiftBottom = 0; // shift due to top axis
  var xName = (col.component) ? col.component.name : col.factor.name;
  var yName = (row.component) ? row.component.name : row.factor.name;
  if(col.hasAxisLeft) {
      plotShiftRight = plotGrid.axisLeft.width;
  }
  if(row.hasAxisTop) {
      plotShiftBottom += plotGrid.axisTop.height;
      svg.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(" + plotShiftRight + "," + plotShiftBottom + ")")
          .append("text")
          .attr("class", "axis_label")
          .attr("x", col.plotWidth / 2)
          .attr("y", -15)
          .style("text-anchor", "middle")
          .text(xName);
  }

  // Add X-axis on bottom
  if(row.hasAxisBottom || x_attr == y_attr) {
      //var xAxis = d3.svg.axis()
      //    .scale(col.xScale)
      //    .orient("bottom");
      var xAxis = d3.axisBottom(col.xScale);
      svg.append("g")
          //.attr("transform", "translate(0," + plotview.height + ")")
          .attr("class", "axis")
          .attr("transform", "translate(" + plotShiftRight + "," + (row.plotHeight + plotShiftBottom) + ")")
          .call(xAxis);
      svg.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(" + plotShiftRight + "," + (row.plotHeight + plotShiftBottom) + ")")
          .append("text")
          .attr("class", "axis_label")
          .attr("x", col.plotWidth / 2)
          .attr("y", plotGrid.axisBottom.height - 30)
          .style("text-anchor", "middle")
          .text(xName);
  }
  // add Y-axis on left
  if(col.hasAxisLeft) {
      var yAxis = d3.axisLeft(row.yScale);
          //.scale(row.yScale)
          //.orient("left");
          //.tickSize(-plotview.width);
      svg.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(" + plotShiftRight + "," + plotShiftBottom + ")")
          .call(yAxis)

      svg.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(" + plotShiftRight + "," + plotShiftBottom + ")")
          .append("text")
          .attr("class", "axis_label")
          .attr("transform", "rotate(-90)")
          .attr("x", -row.plotHeight/2)
          .attr("y", -plotGrid.axisLeft.width)
          .attr("dy", "1.5em")
          .style("text-anchor", "middle")
          .text(yName);
  }

  // svg for drawing datapoints
  plotG = svg.append("g")
      .attr("transform", "translate(" + plotShiftRight + "," + plotShiftBottom + ")")
  plotG.append("rect")
      .attr("class", "frame")
      .attr("width", col.plotWidth)
      .attr("height", row.plotHeight);

  plotG.selectAll("circle.datapoint")
      .data(data) // bind data
      .enter()
      .append("circle").classed("datapoint", true)
      .attr("cx", function(d) { 
          var v = aval(d, x_attr) + jitter();
          return col.xScale(v);
      })
      .attr("cy", function(d) {
          var v = aval(d, y_attr) + jitter();
          return row.yScale(v);
      })
      .attr("r", 5)
      .style("stroke", "black")
      .style("stroke-width", "1px")
      .style("fill", function(d) { 
          //return "#000";
          return getLabelColor(fval(d, 'label'));
      })
      .on("mouseover", handleMouseoverData)
      .on("mouseout", handleMouseoutData)
      .on("click", handleClickData);
  plotG.selectAll("circle.datapoint")
      .filter(function(d, i) { 
          return plotview.selected[i];
      })
      .attr("r", 9)
      .style("stroke", "black")
      .style("stroke-width", "2px")
      .classed("selectedCircle", true);
}

/* Entry Point: Run everything! */
function main() {
  plotview.width = (plotview.outerWidth - plotview.margin.left - plotview.margin.right);
  plotview.height = (plotview.outerHeight - plotview.margin.top - plotview.margin.bottom);
  plotGrid.rows[0].component = plotview.components[1];
  plotGrid.rows[1].component = plotview.components[2];
  plotGrid.cols[1].component = plotGrid.rows[1].component;
  plotGrid.cols[2].component = plotGrid.rows[0].component;

  d3.csv(datasets.expert.path, function(e, d) {
      loadDataCallback(e, d, datasets.expert) } );

  /* when everything loaded, hook up event handlers */
  $(document).ready(function() {
    /* attach handlers for changing dataset */
    $('#loadDataExpert').on('click', function(e) {
        loadData(datasets.expert); } );
    $('#loadDataPerson').on('click', function(e) { 
        loadData(datasets.personal); } );
    $('#clearSelButton').on('click', handleClearSelectedClick);
    /* build component menu for selecting active plots */
    for(mi = 0; mi < 3; mi++) {
      var axisNum = mi + 1;
      var menu = $("#axisMenu" + axisNum);
      for(var fi = 0; fi < plotview.factors.length; fi++) {
        var factor = plotview.factors[fi];
        var factorElem = $(document.createElement('a'))
          .attr({
            class: 'dropdown-item axisMenuItemHeader',
            id: 'f-' + factor.name + '-' + axisNum,
            href: '#',
            onclick: 'handlePlotAxisSelect(' + axisNum + 
                  ', -1, ' + fi + ');'
          });
        factorElem.html(factor.name + ': ');
        menu.append(factorElem);
        var cis = factor.components;
        for(ci = 0; ci < cis.length; ci++) {
          var comp = plotview.components[cis[ci]];
          var compElem = $(document.createElement('a')).attr({
                class: 'dropdown-item axisMenuItem',
                id: 'c-' + comp.name + '-' + axisNum,
                href: '#',
                onclick: 'handlePlotAxisSelect(' + axisNum + 
                  ', ' + cis[ci] + ', -1);'
          });
          compElem.html("&nbsp;&nbsp;" + comp.name);
          menu.append(compElem);
        }
      }
    }

    $('#jitterCheckBtn').on('click', handleJitterCheckbox);
    $('#flattenCheckBtn').on('click', handleFlattenCheckboxClick);

    console.log("Plot init");

    /* attach search bar function */
    $("#searchInput").on('input', handleSearch);
  });
}

function handlePlotFilterCheckboxClick(i) {
  plotview.components[i].display = !(plotview.components[i].display);
  processData(plotview.data, false);
  drawAllPlots(true, false);
}

function handleFlattenCheckboxClick() {
  /* update flatten & update data to reflect this representation */
  plotview.flatten = !(plotview.flatten);
  /* update jitter level to match */
  if(plotview.jitter) {
    plotview.jitterscales.current = (plotview.flatten) ? 
      plotview.jitterscales.flat : plotview.jitterscales.indiv;
  } else {
    plotview.jitterscales.current = 0;
  }
  processData(datasets.active.data, plotview.flatten);
  clearSelection();
  drawAllPlots(true, false);
}

function handleJitterCheckbox() {
  plotview.jitter = !plotview.jitter;
  if(plotview.jitter) {
      plotview.jitterscales.current = (plotview.flatten) ? 
        plotview.jitterscales.flat : plotview.jitterscales.indiv;
  } else {
      plotview.jitterscales.current = 0;
  }
  drawAllPlots(false, false);
}

function handlePlotAxisSelect(axis, componentNum, factorNum) {
  /* num valid if >= 0 */
  var button = $("#axisButton" + axis);
  if(componentNum >= 0) {
    var comp = plotview.components[componentNum];
    button.html(comp.name);
    plotGrid.rows[axis-1].component = comp;
    plotGrid.rows[axis-1].factor = null;
    plotGrid.cols[plotGrid.cols.length - axis].component = comp;
    plotGrid.cols[plotGrid.cols.length - axis].factor = null;
    if(axis == 3) { plotGrid.cols[1].hasAxisLeft = false; }
  } else if(factorNum >= 0) {
    var factor = plotview.factors[factorNum];
    button.html(factor.name);
    plotGrid.rows[axis-1].factor = factor;
    plotGrid.rows[axis-1].component = null;
    plotGrid.cols[plotGrid.cols.length - axis].factor = factor;
    plotGrid.cols[plotGrid.cols.length - axis].component = null;
    if(axis == 3) { plotGrid.cols[1].hasAxisLeft = false; }
  }
  drawAllPlots(true, false);
}

function handleMouseoverData(d, i) {
  var r = d3.select(this).attr('r');
  var text = (d.key) ? d.key : d.task;
  if(!d3.select(this).classed("selectedCircle")) {
      d3.select(this).attr({r: 9});
  }
  d3.select("#tooltip")
    .style("opacity", 0.8)
    .style("left", (d3.event.pageX+5) + "px")
    .style("top", (d3.event.pageY+5) + "px")
    .style("z-index", 100);
  d3.select("#tooltip p")
    .text(text);
  d3.select(this)
    .style("stroke", "black")
    .style("stroke-width", "2px");
}

function handleMouseoutData(d, i) {
  if(!d3.select(this).classed("selectedCircle")) {
      var r = d3.select(this).attr('r');
      d3.select(this).attr({r: 5});
      d3.select(this)
        .style("stroke-width", "1px");
  }
  d3.select("#tooltip")
    .style("opacity", 0)
    .style("left", "0px")
    .style("top", "0px")
    .style("z-index", "inherit");
}

function handleClickData(d, i) {
  plotview.selected[i] = !plotview.selected[i];
  drawAllPlots(false, true);
}

function handleClearSelectedClick() {
  clearSelection();
  drawAllPlots(false, true);
}

function handleSearch() {
  var htmlListId = "#dropdownSearchList";
  var query = $(this).val();

  if(query.length > 2) {
    $("#dropdownContainer").removeClass("d-none");
    $(htmlListId).addClass("show");
    searchTasks(query, plotview.data, htmlListId);
  } else {
    $("#dropdownContainer").addClass("d-none");
    $(htmlListId).removeClass("show");
    clearSearchList(htmlListId);
  }
}

/*****************************************************************/
/* RUN */
/*****************************************************************/
/* run the script! */
main();
