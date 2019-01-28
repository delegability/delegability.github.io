formTaskSelection = ""

function handleSearch() {
  var htmlListId = "#dropdownSearchList";
  var query = $(this).val();

  if(query.length > 2) {
    $("#dropdownContainer").removeClass("d-none");
    $(htmlListId).addClass("show");
    searchTasks(query, ai_query_tasks, htmlListId);
  } else {
    $("#dropdownContainer").addClass("d-none");
    $(htmlListId).removeClass("show");
    clearSearchList(htmlListId);
  }
}

function handleClickData(d, i) {
  // placeholder. search click
  console.log(d);
  formTaskSelection = d;
  $("#searchInput").val(d);
  $("#dropdownContainer").addClass("d-none");
  $("#dropdownSearchList").removeClass("show");
  clearSearchList("#dropdownSearchList");
}

function updateDatapoint(d, i) {
  // placeholder. search mouseout
}

function startBounceDatapoint(d, i) {
  // placeholder. search mouseover
  return;
}

function taskVal(d, i) {
  return d;
}

function showSelectedTask(task) {
  if(task === "") {
    task = "&lt;random&gt;";
  }

  $('#taskSelection p').html(task);
  $('#taskSelection').removeClass("d-none");
}

function handleSaveTaskSelect() {
  /* save btn pressed. close modal, update saved task */
  console.log(formTaskSelection);
  save_task_selection(formTaskSelection);
  showSelectedTask(formTaskSelection);
  $('#pickTask').modal('hide');
}

function handleSaveTaskWrite() {
  /* save btn pressed. close modal, update saved task */
  var task = $('#writeTaskInput').val()
  save_task_selection(task);
  showSelectedTask(task);
  $('#writeTask').modal('hide');
}

/* Entry Point */
/* when everything loaded, hook up event handlers */
function main() {
  $(document).ready(function() {
    // clear any task selection
    save_task_selection("");

    // populate tasks to dropdown
    selectMenu = $('#taskSelectDropdown');
    for(var i = 0; i < ai_query_tasks.length; i++) {
      opt = $(document.createElement('option'));
      opt.html(ai_query_tasks[i]);
      opt.attr('value', ai_query_tasks[i]);
      selectMenu.append(opt);
    }

    /* attach search bar function */
    $("#searchInput").on('input', handleSearch);
    $("#pickTask #save").on('click', handleSaveTaskSelect);
    $("#writeTask #save").on('click', handleSaveTaskWrite);
    $("#taskSelectDropdown").change(function() {
        formTaskSelection = this.value;
    });
  });
}

/*****************************************************************/
/* RUN */
/*****************************************************************/
/* run the script! */
main();
