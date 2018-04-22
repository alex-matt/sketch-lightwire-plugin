let LightWire = require('./lightwire');

// Custom handler name used because of Sketch bug
// Reference: http://sketchplugins.com/d/708-does-not-contain-a-handler-function-named-onrun-plugin-output
export function start(context) {
  LightWire(context, 'artboards')
}
