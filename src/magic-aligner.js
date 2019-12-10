const sketch = require('sketch')
const UTIF = require('./UTIF.js')

const typePoint = 1
const typeHorizontal = 2
const typeVertical = 3

export var alignToCentroid = function(context) {
  doMagicAlign(context, typePoint)
  context.document.showMessage("Align to Center of Mass");
}

export var horizontallyAlignToCentroid = function(context) {
  doMagicAlign(context, typeHorizontal)
  context.document.showMessage("Align X to Center of Mass");
}

export var verticallyAlignToCentroid = function(context) {
  doMagicAlign(context, typeVertical)
  context.document.showMessage("Align Y to Center of Mass");
}

function doMagicAlign(context, type){
  
  let document = sketch.fromNative(context.document)
  let selectedLayers = toArray(document.selectedLayers)
  
  selectedLayers.forEach
  (selectedLayer => {
    let pixels = generateImage(selectedLayer)
    let magicPoint = getMagicPoint(pixels, selectedLayer.frame)
    applyOffset(selectedLayer, magicPoint[0], magicPoint[1], type)
  });
}

//pixels input is ifds (image file directories)
function getMagicPoint(pixels, layerFrame){
  let width = pixels.width
  let height = pixels.height
  let resolution = width*height

  let middleX = (width-1)/2
  let middleY = (height-1)/2
  
  var totalXValue = 0
  var totalYValue = 0
  var totalAlpha = 0
  
  for(let i = 3; i < resolution * 4; i=i+4) {
    let pixelQuartet = Math.floor(i / 4)
    let x = pixelQuartet % width
    let y = Math.floor(pixelQuartet / width)
    let value = pixels.data[i]/255
		//print("x: " + x + " y: " + y + " A: " + value)
    
		totalXValue = totalXValue + (x * value)
		totalYValue = totalYValue + (y * value)
    totalAlpha = totalAlpha + value
  }

  let tiffMagicX = (totalXValue/totalAlpha) - middleX
	let tiffMagicY = (totalYValue/totalAlpha) - middleY

  let magicX = -tiffMagicX * layerFrame.width / (width)
  let magicY = -tiffMagicY * layerFrame.height / (height)
  
  //print("x: " + magicX + " y: " + magicY)
  let output = [magicX, magicY]
  return output
}

function figureOutScale(maxPixelDimension, layerFrame) {
  let layerWidth = layerFrame.width
  let layerHeight = layerFrame.height
  var output = 0.5

  if (layerWidth > layerHeight){
    output = maxPixelDimension/layerWidth
  }
  else{
    output = maxPixelDimension/layerHeight
  }
  return output
}

function generateImage(layer) {
  let imageScale = figureOutScale(128, layer.frame)
  const options = { formats: 'tiff', output: false, scales: imageScale.toString()}
  
  let currentRotation = layer.transform.rotation
  layer.transform.rotation = 0
  const buffer = sketch.export(layer, options)
  layer.transform.rotation = currentRotation
  
	//ifds stands for image file directories
  let ifds = UTIF.decode(buffer)
  UTIF.decodeImage(buffer, ifds[0])
  return ifds[0]
}

function applyOffset(layer, x, y, type) {

    let layerAngle = layer.transform.rotation * Math.PI / 180
    var finalX = 0
    var finalY = 0

    if (type == typePoint) {
      finalX = Math.cos(layerAngle) * x - Math.sin(layerAngle) * y
      finalY = Math.sin(layerAngle) * x + Math.cos(layerAngle) * y
    }
    else if (type == typeHorizontal) {
      finalX = Math.cos(layerAngle) * x - Math.sin(layerAngle) * y
    }
    else if (type == typeVertical) {
      finalY = Math.sin(layerAngle) * x + Math.cos(layerAngle) * y
    }

		layer.frame.offset(Math.round(finalX), Math.round(finalY))
		

    print("x: " + finalX + " y: " + finalY + " r: " + layerAngle)
  //}

}

function toArray(nsArray) {
  return nsArray.map(el => el)
}

/*
function getRGBAData(pixels){
  let width = pixels.width
  let height = pixels.height
  let resolution = pixels.data.length
  print(pixels.width)
  print(pixels.height)
  print(pixels.data.length)
  
  var pixelType = 0 //0-R; 1-G; 2-B; 3-A
  for(let i = 0; i < resolution; i++) {
    let pixelQuartet = Math.floor(i / 4)
    let x = pixelQuartet % width
    let y = Math.floor(pixelQuartet / width)
    print(x)
    print(y)
    print(pixelType)
    print(pixels.data[i]) //value
    print("\n")
  
    pixelType ++
    if (pixelType == 4){
      pixelType = 0
    }
  }
}
*/
