var datasets = {
  expert: {
    name: "Expert",
    path: "data/anon-cleaned-results-expert.csv",
    data: null
  },
  personal: {
    name: "Personal",
    path: "data/anon-cleaned-results-personal.csv",
    data: null
  },
  active: null,
};

/* util sprintf functionality, from stackoverflow:
 * https://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format */
// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

function bindClick(f, i) {
  return function() { f(i); };
}

function fval(d, attr) {
  return (d.value) ? d.value[attr] : d[attr];
}

/* return task; could be flattened (rolled up with task as key) or raw*/
function taskVal(d) {
  return (d.key) ? d.key : d.task;
}

/* abstraction for factorVal & fval. */
/* factorVal should average all component fvals */
function aval(d, item) {
  if(item.key) {
    // only components have keys
    return fval(d, item.key);
  } else {
    return factorVal(d, item);
  }
}

/* average all values for components within the factor */
function factorVal(d, f) {
  var total = 0;
  for(var i = 0; i < f.components.length; i++) {
    total += fval(d, plotview.components[f.components[i]].key);
  }
  return total / f.components.length;
}

/* get value: data could be 'flat'/'averaged by task' or raw */
function fval(d, attr) {
  // d.values if averaged, d[attr] if raw
  return (d.value) ? +d.value[attr] : +d[attr];
}

