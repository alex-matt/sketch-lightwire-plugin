function Parser(doc) {
  let self = this;

  this.getContext = function() {
      var doc = NSDocumentController.sharedDocumentController().currentDocument();
      var initColor;

      if (MSApplicationMetadata.metadata().appVersion > 41.2) {
          var selection = doc.selectedLayers().layers();
      } else {
          var selection = doc.selectedLayers();
      }

      return {
          document : doc,
          selection : selection
      }
  }

  this.artboardForItem = function(document, item) {
    log(item.parentGroup());
    if (item.className() == 'MSArtboardGroup') {
      return item;
    } else {
      var parent = item.parentGroup();
      return self.artboardForItem(document, parent);
    } /*else if (item.container != null) {
      return self.artboardForItem(document, item.container);
    } else {
      return null;
    }*/
  };

  this.getParentArtboards = function() {
    let context = self.getContext();

    var document = context.document;
    var selection = context.selection;
    var page = document.currentPage();

    var artboardsToSelect = [];

    for(var i = 0; i < selection.length; i++) {
      var item = selection[i];
      var artboard = self.artboardForItem(document, item);
      if (artboard != null) {
        artboardsToSelect.push(artboard);
      }
    };

    return artboardsToSelect;
  }

  this.findLayersMatchingPredicate_inContainer_filterByType = function(predicate, container, layerType) {
      var scope;
      switch (layerType) {
          case MSPage :
              scope = doc.pages()
              return scope.filteredArrayUsingPredicate(predicate)
          break;

          case MSArtboardGroup :
              if(typeof container !== 'undefined' && container != nil) {
                  if (container.className == "MSPage") {
                      scope = container.artboards()
                      return scope.filteredArrayUsingPredicate(predicate)
                  }
              } else {
                  // search all pages
                  var filteredArray = NSArray.array()
                  var loopPages = doc.pages().objectEnumerator(), page;
                  while (page = loopPages.nextObject()) {
                      scope = page.artboards()
                      filteredArray = filteredArray.arrayByAddingObjectsFromArray(scope.filteredArrayUsingPredicate(predicate))
                  }
                  return filteredArray
              }
          break;

          default :
              if(typeof container !== 'undefined' && container != nil) {
                  scope = container.children()
                  return scope.filteredArrayUsingPredicate(predicate)
              } else {
                  // search all pages
                  var filteredArray = NSArray.array()
                  var loopPages = doc.pages().objectEnumerator(), page;
                  while (page = loopPages.nextObject()) {
                      scope = page.children()
                      filteredArray = filteredArray.arrayByAddingObjectsFromArray(scope.filteredArrayUsingPredicate(predicate))
                  }
                  return filteredArray
              }
      }
      return NSArray.array() // Return an empty array if no matches were found
  }

  this.findLayersNamed_inContainer_filterByType = function(layerName, container, layerType) {
      var predicate = (typeof layerType === 'undefined' || layerType == nil) ? NSPredicate.predicateWithFormat("name == %@", layerName) : NSPredicate.predicateWithFormat("name == %@ && class == %@", layerName, layerType)
      return self.findLayersMatchingPredicate_inContainer_filterByType(predicate, container)
  }
}

module.exports = Parser
