var panelType;

function get(path, callback) {
  $.get('../' + path, callback);
}

function hideBackBtn() {
  $('.header').removeClass('header__with-back-btn');
}

function showBackBtn() {
  var backBtnElem = $('.header');

  if(!backBtnElem.hasClass('header__with-back-btn')) {
    backBtnElem.addClass('header__with-back-btn');
  }
}

function normalizeCategoryName(name) {
  return name.toLowerCase().replace(/[ \&]+/g, '-')
}

function callPlugin(actionName) {
  if (!actionName) {
    throw new Error('missing action name')
  }
  var args = [].slice.call(arguments).slice(1)
  var previousHash = (window.location.hash.split('?')[1] ? window.location.hash.split('?')[0] : window.location.hash)
  window.location.hash = previousHash +
    '?pluginAction=' + encodeURIComponent(actionName) +
    '&actionId=' + Date.now() +
    '&pluginArgs=' + encodeURIComponent(JSON.stringify(args))
  return
}

var route = [];
var menuJSON = [];

function processListJSON(items) {
  var listHTML = '';

  for(var i = 0; i < items.length; i++) {
    var item = items[i];

    var backgroundImage;

    if(item.hasOwnProperty('a')) {
      backgroundImage = item.a
    } else {
      backgroundImage = normalizeCategoryName(item.n)
    }

    backgroundImage += '.jpg'

    listHTML += '' +
      '<div class="list-item" data-index="' + i.toString() + '" style="background-image: url(\'../' + backgroundImage + '\')">' +
        '<div class="list-item__background"></div>' +
        '<span class="list-item__title">' + item.n + '</span>' +
      '</div>';
  }

  $('.list').html(listHTML);

  var listItems = $('.list-item');

  var listClickHandler = function(e) {
    var index = this.getAttribute('data-index');

    var sketchFileName = '';

    if(items[index].hasOwnProperty('category')) {
      sketchFileName = items[index].category
    } else {
      var routeLastObj = menuJSON;

      for(var i = 0; i < route.length; i++) {
        sketchFileName += normalizeCategoryName(routeLastObj[route[i]].n) + '-'
      }

      sketchFileName = sketchFileName.substr(0, sketchFileName.length - 1);
    }

    sketchFileName = panelType + '-' + sketchFileName

    if(items[index].hasOwnProperty('l')) {
      callPlugin('insert', '*' + items[index].l, sketchFileName)
    } else if(items[index].hasOwnProperty('a')) {
        callPlugin('insert', items[index].a, sketchFileName)
    } else {
      route.push(this.getAttribute('data-index'));

      showBackBtn();

      if(items[index].hasOwnProperty('i')) {
        processListJSON(items[index].i);
      } else {
        $('.list').html('');
      }
    }
  };

  for (var i = 0; i < listItems.length; i++) {
      listItems[i].addEventListener('click', listClickHandler, false);
  }
}

function initializeWebView(type) {
  panelType = type;

  get(type + '.json', function(result) {
    menuJSON = JSON.parse(result);
    processListJSON(menuJSON)
  });

  var lastSearchValue = '';

  $('.header__back-btn').click(function() {
    if(lastSearchValue != '') {
      var inputElem = $('.header__search-input .input__input');
      inputElem.val('');
      inputElem.trigger('keyup');
    }

    route.pop();

    var items;

    for(var i = 0; i < route.length; i++) {
      items = menuJSON[i].i;
    }

    if(items === undefined) {
      items = menuJSON;
      hideBackBtn();
    }

    processListJSON(items);
  });

  $('.header__search-input .input__input').keyup(function() {
    var result = [];
    var searchString = $.trim($(this).val());

    if(lastSearchValue == '' && searchString == '') {
      return;
    } else if(lastSearchValue == '' && searchString != '') {
      showBackBtn();
      lastSearchValue = searchString;
    } else if(lastSearchValue != '' && searchString == '') {
      lastSearchValue = '';
      hideBackBtn();
      processListJSON(menuJSON);
      return;
    }

    function checkNamesRecursive(menu, category, recursion) {
      if(recursion === undefined) {
        recursion = 0
      } else {
        recursion++;
      }

      for(var i = 0; i < menu.length; i++) {
        if(recursion == 0) {
          category = '';
        }

        var menuObj = menu[i];

        var name = menuObj.n.toLowerCase();

        if (name.indexOf(searchString.toLowerCase()) != -1) {
          if(category != '' && !menuObj.hasOwnProperty('i')) {
            menuObj.category = category.substr(0, category.length - 1)
          }

          result.push(menuObj);
        }

        if(menuObj.hasOwnProperty('i')) {
          category += normalizeCategoryName(menuObj.n) + '-';

          checkNamesRecursive(menuObj.i, category, recursion);
        }
      }
    }

    checkNamesRecursive(menuJSON);
    processListJSON(result);
  });
}

$(document).ready(function() {
  callPlugin('webViewLoaded');
});
