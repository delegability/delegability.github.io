var tableview = {
  components: [
    {key:'label', name:'Delegability', display:true, factor:0, tooltip:"1 (human only) to 4 (AI only)", max:4},
    {key:'t_machine_ability', name:'Machine Ability', display:true, factor:1, max:5},
    {key:'t_process', name:'Process', display:true, factor:1, max:5},
    {key:'t_values', name:'Value Alignment', display:true, factor:1, max:5},
    {key:'d_abilities', name:'Human Ability', display:false, factor:2, max:5},
    {key:'d_effort', name:'Effort Required', display:false, factor:2, max:5},
    {key:'d_expertise', name:'Expertise Required', display:true, factor:2, max:5},
    {key:'s_creativity', name:'Creative Skills Req', display:true, factor:2, max:5},
    {key:'s_social_skills', name:'Social Skills Req', display:true, factor:2, max:5},
    {key:'r_accountable', name:'Accountability', display:false, factor:3, max:5},
    {key:'r_impact', name:'Impact', display:false, factor:3, max:5},
    {key:'r_uncertainty', name:'Uncertainty', display:false, factor:3, max:5},
    {key:'m_important', name:'Utility', display:false, factor:4, max:5},
    {key:'m_intrinsic', name:'Intrinsic', display:false, factor:4, max:5},
    {key:'m_learning', name:'Learning Goal', display:false, factor:4, max:5} ],
  factors: [
    {name:"Delegability", c:'#AED6F1', components: [0], max:4},
    {name:"Trust",        c:'#ABEBC6', components: [1, 2, 3], max:5},
    {name:"Difficulty",   c:'#FAD7A0', components: [4, 5, 6, 7, 8], max:5},
    {name:"Risk",         c:'#F9E79F', components: [9, 10, 11], max:5},
    {name:"Motivation",   c:'#F5B7B1', components: [12, 13, 14], max:5} ],
  data: null,
  flatten: true,
  color: true,
  factorGroup: true,
  sortBy: { col: 0, ascending: false }
}

/*****************************************************************/
/* FUNCTIONS */
/*****************************************************************/
/* Entry Point: Run everything! */
function main() {
    // adjust defaults based on viewport size.
    var viewportWidth = $(window).width();
    if(viewportWidth <= 576) {
      for(var i = 2; i < tableview.components.length; i++) {
        tableview.components[i].display = false;
      }
    }

    /* need to load both JSON and CSV before we can go. */
    d3.csv(datasets.personal.path, function(e, d) {
        loadDataCallback(e, d, datasets.personal) } );

    /* when everything loaded, hook up event handlers */
    $(document).ready(function() {

        $('#loadDataExpert').on('click', function(e) {
            loadData(datasets.expert); } );
        $('#loadDataPerson').on('click', function(e) { 
            loadData(datasets.personal); } );
        $('#hiDel1').on('click', function(e) {
            highlightDelegabilityRow(1); } );
        $('#hiDel2').on('click', function(e) {
            highlightDelegabilityRow(2); } );
        $('#hiDel3').on('click', function(e) {
            highlightDelegabilityRow(3); } );
        $('#hiDel4').on('click', function(e) {
            highlightDelegabilityRow(4); } );
        $('#flattenCheckBtn').on('click', handleFlattenCheckbox);
        $('#factorGroupCheckBtn').on('click', handleFactorGroupCheckbox);
        $('#colorCheckBtn').on('click', handleColorCheckbox);

        var menu = $("#filter-menu form div");
        for(var fi = 0; fi < tableview.factors.length; fi++) {
            var factorNameSpan = $(document.createElement('span'))
                .attr({class: 'factorFilterCheckText'});
            factorNameSpan.html(tableview.factors[fi].name + ': ');
            var factorSpan = $(document.createElement('span'))
                .attr({class: 'factorFilterCheckSpan'});
            factorSpan.append(factorNameSpan);
            var cis = tableview.factors[fi].components;
            for(ci = 0; ci < cis.length; ci++) {
                var i = cis[ci];
                var span = $(document.createElement('span')).attr({
                      class: 'filterCheckSpan'});
                var input = $(document.createElement('input')).attr({
                      id:    'filter-checkbox-{0}'.format(i),
                      name:  tableview.components[i].key,
                      type:  'checkbox',
                      class: 'form-check-input'
                   });
                input.on('click', bindClick(handleFilterCheckboxClick, i));
                if(tableview.components[i].display) {
                    input.prop('checked', true);
                }
                var label = $(document.createElement('label')).attr({
                      class: "form-check-label",
                      for: "filter-checkbox-{0}".format(i)});
                if(i != 0) {
                    label.html(tableview.components[i].name);
                }
                span.append(input);
                span.append(label);
                factorSpan.append(span);
            }
            menu.append(factorSpan);
        }
        $("#filter-menu").addClass("d-none");
    });
}

function loadData(dataset) {
    /* if no data, load; else, use stored data */
    if(dataset.data == null) {
        d3.csv(dataset.path, function(e, d) {
            loadDataCallback(e, d, dataset) } );
    } else {
        loadDataCallback(null, dataset.data, dataset);
    }
}

function highlightDelegabilityRow(level) {
    data = datasets.active.data;
    var table = d3.select('body table tbody');
    /* clear existing highlights */
    table.selectAll("tr").classed("table-primary", false);
    table.selectAll('tr')
        .data(data)
        .filter(function(d) { return d.label == level })
        .attr("class", "table-primary");
}

/* This function takes the raw data from the CSV and transforms it
 * into a more useful form, grouping responses */
function loadDataCallback(error, rawdata, dataset) {
    if (error) throw error;
    if (!dataset.data) {
        dataset.data = rawdata;
    }

    // create the table!
    datasets.active = dataset;
    processData(rawdata, tableview.flatten, false);
    drawTable();
    updateTableTitle(dataset)
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
              for (i = 0; i < tableview.components.length; i++) {
                attr = tableview.components[i].key;
                retval[attr] = d3.mean(d, function(dd) {
                  return dd[attr];
                });
              }
              return retval;
            })
            .entries(data);
    }

    // sort? transform data appropriately.
    var col = tableview.sortBy.col;
    if(col != null) {
        var attr = tableview.components[col].key;
        data = data.sort(function(a, b) {
            var v1 = fval(a, attr);
            var v2 = fval(b, attr);
            if(tableview.factorGroup) {
                var factor = tableview.factors[col];
                v1 = avgFactorValues(a, factor);
                v2 = avgFactorValues(b, factor);
            }
            if(tableview.sortBy.ascending) {
                return d3.ascending(v1, v2);
            } else {
                return d3.descending(v1, v2);
            }
        });
    }

    tableview.data = data;
}

function avgFactorValues(d, factor) {
    var avg = 0;
    for(var i = 0; i < factor.components.length; i++) {
        var comp = tableview.components[factor.components[i]].key
        var value = (d.value) ? d.value[comp] : d[comp];
        avg += +value;
    }
    // calc avg & round to 2 decimal places. js floats are weird.
    avg = avg / factor.components.length;
    avg = Math.round((avg + 0.00001) * 100) / 100; 
    return avg;
}

function getTableCellStyle(val, maxVal) {
  var style = "";
  if(tableview.color) {
    style = "background-color:" + getColor(val, maxVal);
    if(val > (maxVal - 1) || val < 2) {
      style += ";color:#fff;";
    }
  }

  return style;
}

function dataToFactorColumn(row, i) {
    var task = (row.key) ? row.key : row.task;
    var table_row = [
      {html:i+1, style:''}, // table row index
      {html:task, style:''}]; // row task
    var data_cells = tableview.factors.map(function(f, fi) {
          var cell = {}
          var avg_val = avgFactorValues(row, f);
          cell['html'] = avg_val;
          cell['style'] = getTableCellStyle(avg_val, f.max);
          //if(tableview.color) {
          //    cell['style'] = "background-color:" + getColor(avg_val);
          //    if(avg_val > 4 || avg_val < 2) {
          //        cell['style'] += ";color:#fff;";
          //    }
          //}
          if(avg_val) return cell;
    }).filter(function(d) { return d; });
    return table_row.concat(data_cells);
}

function dataToColumn(row, i) {
    var task = (row.key) ? row.key : row.task;
    var table_row = [
      {html:i+1, style:''}, // table row index
      {html:task, style:''}]; // row task
    var data_cells = tableview.components.map(function(comp, ci) { 
        if(comp.display) {
            var cell = {};
            var value = (row.value) ? 
                row.value[comp.key] : row[comp.key];
            cell['html'] = value;
            cell['style'] = getTableCellStyle(value, comp.max);
            //if(tableview.color) {
            //    cell['style'] = "background-color:" + getColor(value, maxVal);
            //    if(value > 4 || value < 2) {
            //        cell['style'] += ";color:#fff;";
            //    }
            //}
            return cell;
        }
    }).filter(function(d) { return d; });
    return table_row.concat(data_cells);
}

function updateTableTitle(dataset) {
  d3.selectAll('#table-title')
      .text('Table Display Options (' + dataset.name + ' Dataset)');
}

function drawFactorTable(data) {
    // create table
    var table_container = d3.select('#table-container')
    // delete existing table
    table_container.selectAll('table').remove()
    var table = d3.select('#table-container')
        .append('table')
        .attr('class', 'table table-sm table-hover');
    // create table header
    var headers = [{name:'#', i:null}, {name:'Task', i:null}];
    headers = headers.concat(tableview.factors
        .map(function(d,i) { return {name:d.name, i:i}; }));
    table.append('thead').attr("class", "thead-dark")
        .append('tr')
        .selectAll('th')
        .data(headers).enter()
        .append('th')
        .attr('scope', "col")
        .append('a')
        .on('click', function(d) { toggleSort(d.i); })
        .text(function(d) { return d.name; });
    // create table body
    table.append('tbody')
        .selectAll('tr')
        .data(data).enter()
        .append('tr')
        .selectAll('td')
        .data(dataToFactorColumn).enter()
        .append('td')
        .attr('style', d3.f('style'))
        .html(d3.f('html'));
}

function drawTable() {
    // update html table to reflect data view. entry point.
    var data = tableview.data;
    if(tableview.factorGroup) {
        drawFactorTable(data);
    } else {
        drawComponentTable(data);
    }
}

function drawComponentTable(data) {
    var table_container = d3.select('#table-container')
    table_container.selectAll('table').remove()
    var table = d3.select('#table-container')
        .append('table')
        .attr('class', 'table table-sm table-hover');
    // create table header
    var headers = [
      {name:'#', i:null, color:'#bbb'}, 
      {name:'Task', i:null, color:'#bbb'} ];
    headers = headers.concat(tableview.components
        .map(function(d,i) { 
            return {
                name:d.name, disp:d.display, i:i,
                color:tableview.factors[d.factor].c,
                tooltip:d.tooltip}; })
        .filter(function(d,i) { return d.disp; }) );
    table.append('thead').attr("class", "thead-dark")
        .append('tr')
        .selectAll('th')
        .data(headers).enter()
        .append('th')
        .attr('scope', "col")
        .append('a')
        .attr('title', function(d) { return d.tooltip; })
        .on('click', function(d) { toggleSort(d.i); })
        .text(function(d) { return d.name; });
    // create table body
    table.append('tbody')
        .selectAll('tr')
        .data(data).enter()
        .append('tr')
        .selectAll('td')
        .data(dataToColumn).enter()
        .append('td')
        .attr('style', d3.f('style'))
        .html(d3.f('html'));
}

function getColor(val, maxVal) {
    var color ='#fff';
    if(+val) {
      var num = ((+val - 1) / (maxVal-1));
      //color = d3.interpolateGreens(num);
      color = d3.interpolateRdBu(num);
    }

    return color;
}

/*****************************************************************/
/* UI FUNCTIONS */
/*****************************************************************/
function handleFlattenCheckbox() {
    var flatten = d3.select("#flattenCheck")
          .property("checked");
    tableview.flatten = !flatten;
    processData(datasets.active.data, tableview.flatten);
    drawTable();
}

function handleFactorGroupCheckbox() {
    tableview.factorGroup = !tableview.factorGroup;
    if(tableview.factorGroup) {
      $("#filter-menu").addClass("d-none");
    } else {
      $("#filter-menu").removeClass("d-none");
    }
    drawTable();
}

function handleColorCheckbox() {
    tableview.color = !tableview.color;
    drawTable();
}

function handleFilterCheckboxClick(i) {
    tableview.components[i].display = !(tableview.components[i].display);
    processData(tableview.data, false);
    drawTable();
}

function toggleSort(i) {
    if(tableview.sortBy.col == i) {
        tableview.sortBy.ascending = !(tableview.sortBy.ascending);
    } else {
        tableview.sortBy.col = i;
        tableview.sortBy.ascending = false;
    }
    processData(tableview.data, false);
    drawTable();
}

/* run the script! */
main();
