function setTrigger(bodyId, triggerId, initCollapse) {
  // Panel expand/collapse
  var content = $(bodyId);
  var trigger = $(triggerId);
  if(initCollapse) {
    content.hide();
  } else {
    trigger.find('.collapse-text').text('(Click to collapse)');
  }
  trigger.click(function(){
    content.toggle();
    var isVisible = content.is(':visible');
    if(isVisible){
      trigger.find('.collapse-text').text('(Click to collapse)');
    }else{
      trigger.find('.collapse-text').text('(Click to expand)');
    }
  });
  // end expand/collapse
}

function setSectionTrigger(buttonId, prevTrig, nextTrig, nextSect) {
  var button = $(buttonId);
  button.click(function() {
    nextSection(prevTrig, nextTrig, nextSect);
  });
}

function nextSection(prevTrig, nextTrig, nextSect) {
  $(prevTrig).click();
  var isVisible = $(nextSect).is(':visible');
  if(!isVisible) {
    $(nextTrig).click();
  }
}

function expandSection(sect, trig) {
  var isVisible = $(sect).is(':visible');
  if(!isVisible) {
    $(trig).click();
  }
}

function expandAll() {
  // expand all the sections
  expandSection('#demoBody', '#collapseTrigger2');
  expandSection('#studyBody', '#collapseTrigger3');
  window.scroll(0, 100000);
}

function validateForm() {
  expandAll();
  errors = 0;
  $("#input-form input:radio").each(function(){
    var name = $(this).attr("name");
    if($("input:radio[name="+name+"]:checked").length == 0){
      $(this).parents('div').addClass('warning');
      errors++;
    } else {
      $(this).parents('div').removeClass('warning');
    }
  });
  if(errors > 0){
      $('#errorMsg').removeClass("d-none")
      return false;
  } else {
      $('#errorMsg').addClass("d-none")
  }
  return true;
}

$(document).ready(function() {
  /* set up section collapse triggers */
  setTrigger('#consentBody', '#collapseTrigger0', false);
  setTrigger('#instructionBody', '#collapseTrigger1', false);
  setTrigger('#demoBody', '#collapseTrigger2', true);
  setTrigger('#studyBody', '#collapseTrigger3', true);
  setSectionTrigger('#finishConsent', '#collapseTrigger0', '#collapseTrigger1', '#instructionBody');
  setSectionTrigger('#finishInstructions', '#collapseTrigger1', '#collapseTrigger2', '#demoBody');
  setSectionTrigger('#finishDemo', '#collapseTrigger2', '#collapseTrigger3', '#studyBody');
  $('#submitButton').click(expandAll);

  /* get random task, fill into form */
  var randomTask = get_random_task();
  $("#input-form input:hidden[name=task]").val(randomTask);
  $("#taskDisplay").html(randomTask);

  /* set up submit button script */
  $('#input-form').url = 'https://script.google.com/macros/s/AKfycbz-44uDE5N-KdaK0dvF57z3EmnxVR_gVPnOJ-c1pCbBgOHQ6oo/exec'
  var allowSubmit = true;
  $('#form-submit').on('click',function(e) {
    e.preventDefault();

    // validate input
    if (!allowSubmit) {
      console.log("Already submitted.");
      return;
    }
    var isValid = validateForm();
    if (!isValid) {
      return;
    }

    console.log("Submitting form...");
    var form = $('#input-form');
    var data = form.serialize();
    var jqxhr = $.ajax({
      url: 'https://script.google.com/macros/s/AKfycbz-44uDE5N-KdaK0dvF57z3EmnxVR_gVPnOJ-c1pCbBgOHQ6oo/exec',
      method: "POST",
      data: data,
      contentType: "multipart/form-data",
      contentType: "application/x-www-form-urlencoded",
    }).done(
      function() {
        allowSubmit = false;
        $('#successMsg').removeClass("d-none");
        $('serverErrorMsg').addClass("d-none");
    }).fail(
      function() {
        $('serverErrorMsg').removeClass("d-none");
      }
    );
  });
});

