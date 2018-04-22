let WebUI = require('./panel');
let Parser = require('./parser');

function LightWire(context, type) {

	let self = this;

	this.context = context;
	this.type = type;

	this.start = function start() {
		// `self.type` variable is used because there will be more menu options, not only Artboards
		const identifier = 'lightwire.' + self.type;
		let mainThread = NSThread.mainThread();
	  let threadDictionary = mainThread.threadDictionary();

	  if(threadDictionary[identifier]
			// `isOpened` doesn't exist after plugin update
			// while plugin thread is still running for unknown reason.
			// The same thread bug happens even after launching Cococa `Hello World` script
			&& threadDictionary[identifier].panel.hasOwnProperty('isOpened')
			&& threadDictionary[identifier].panel.isOpened) {
	    const thread = threadDictionary[identifier]
			thread.close();
	  } else {
	    const webUI = new WebUI(context, require('./../assets/html/panel.html'), {
	      identifier: identifier, // to reuse the UI
	      x: 0,
	      y: 0,
	      width: 200,
	      height: 451,
	      blurredBackground: true,
	      onlyShowCloseButton: true,
	      title: 'Lightwire',
	      hideTitleBar: false,
	      shouldKeepAround: true,
	      resizable: false,
	      uiDelegate: {},
				handlers: {
					insert: function (name, sketchFileName) {
	          self.insert(name, sketchFileName);
				  },
					webViewLoaded: function() {
						webUI.eval(
						  'initializeWebView(\'' + self.type + '\')'
						);
					}
				}
	    });
	  }
	}

	this.insert = function insert(name, sketchFileName) {
		var sourceDoc = MSDocument.new()

		if(sourceDoc.readFromURL_ofType_error(context.plugin.urlForResourceNamed(sketchFileName + ".sketch").path(), "com.bohemiancoding.sketch.drawing", nil)) {
			const parser = new Parser(sourceDoc)

			let obj = parser.findLayersNamed_inContainer_filterByType(name, sourceDoc.document)[0].duplicate();

			let context = parser.getContext();
			let currentDoc = context.document
			let currentPage = currentDoc.currentPage();
			let addToSelectedArtboard = obj.className() != 'MSArtboardGroup';

			let scroll = currentDoc.scrollOrigin()
		  let zoom = currentDoc.zoomValue()
			let windowFrameSize = currentDoc.currentContentViewController().contentDrawView().frame().size

			let topLeftX = (scroll.x / zoom) * (-1)
			let topLeftY = (scroll.y / zoom) * (-1)

			let futureElementSize = obj.frame()
			let futureElementCenterX = (windowFrameSize.width / 2) / zoom - futureElementSize.width() / 2
			let futureElementCenterY = (windowFrameSize.height / 2) / zoom - futureElementSize.height() / 2

			obj.setOrigin({x: topLeftX + futureElementCenterX, y: topLeftY + futureElementCenterY});

			if(addToSelectedArtboard) {
				let artboards = parser.getParentArtboards();

				for (var i = 0; i < artboards.length; i++) {
		      var artboard = artboards[i];
		      artboard.addLayers([obj]);
		    }
			}

			if(!addToSelectedArtboard) {
				currentPage.addLayers([obj])
			}

			currentPage.changeSelectionBySelectingLayers([obj])

			currentDoc.showMessage(self.type.charAt(0).toUpperCase() + self.type.substr(1, self.type.length - 2) + ' has been added');
		}

		sourceDoc.close()
		sourceDoc = nil
	}

	this.start();
}

module.exports = LightWire
