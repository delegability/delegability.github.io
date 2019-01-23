function searchTasks(query, data, targetId) {
  var lowerQuery = query.toLowerCase();
  var selected_tasks = [];

  var matchedData = data.filter(function(d, i) {
    var task = taskVal(d).toLowerCase(); 
    var isMatch = task.includes(lowerQuery);
    if(isMatch) {
        selected_tasks.push(i);
    }
    return isMatch;
  });

  var items = d3.select(targetId)
      .selectAll("li")
      .data(matchedData);
  var exitItems = items.exit()
      .remove();
  var totalItems = items.enter()
      .append("li")
      .attr("class", "dropdown-item")
      .merge(items)
      .on("mouseover", startBounceDatapoint)
      .on("mouseout", function(d, i) {
          var global_data_i = selected_tasks[i];
          updateDatapoint(data[global_data_i], global_data_i);
      })
      .on("click", function(d, i) {
          var global_data_i = selected_tasks[i];
          handleClickData(data[global_data_i], global_data_i);
      })
      .html(function(d) {
          var task = taskVal(d);
          return annotateQuery(lowerQuery, task);
      });

  if(matchedData.length == 0) {
    var items = d3.select(targetId)
      .append("li")
      .attr("class", "dropdown-item")
      .append("span")
      .attr("color", "red")
      .text("< no matching tasks >");
  }
}

function annotateQuery(query, task) {
  var begin = task.toLowerCase().indexOf(query);
  var end = begin + query.length;
  var spanned = task.slice(begin, end);
  return task.slice(0, begin) + '<span style="color:red">' + spanned + '</span>' + task.slice(end);
}

function clearSearchList(targetId) {
  d3.select(targetId)
    .selectAll("li")
    .remove();
}

