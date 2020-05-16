const MAX_FILE_SIZE = 500 * 1024,
      MAX_WIDTH = 700,
      MAX_HEIGHT = 700

export async function resize(file){
  // Resize method & size validation
  if (file.size <= MAX_FILE_SIZE){
    console.debug(`file is small enough (${file.size})`)
    return file
  }

  const content  = new Uint8Array(await file.arrayBuffer())

  let dimensions
  if (file.type === 'image/jpeg')
    dimensions = getJpegSize(content, file.size)
  else
    throw new Error('Image format not supported')

  const targetSize = getDesiredSize(dimensions)

  const img = await getImage(file),
        canvas = document.createElement('canvas')

  canvas.width = targetSize.width
  canvas.height = targetSize.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, targetSize.width, targetSize.height)
  const newFile = await getBlob(ctx, file.type)
  // TODO: resize. See https://zocada.com/compress-resize-images-javascript-browser/
  return newFile
}

function getBlob(ctx, mime){
  return new Promise((resolve, reject) => {
    ctx.canvas.toBlob(blob => {
      resolve(new Blob([blob], {type: mime}))
    }, mime)
  })
}

function getDataUrl(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', e => {
      resolve(e.target.result)
    }, false)
    reader.readAsDataURL(file)
  })
}

function getImage(file){
  return new Promise(async (resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', e => { resolve(img) })
    img.src = await getDataUrl(file)
  })
}


// get dimensions of image with same aspect ratio, both dimensions respecting their max size
function getDesiredSize({height, width}){
  // debugger
  let dh = height,
      dw = width

  if (dh > MAX_HEIGHT){
    dw = width * MAX_HEIGHT / dh
    dh = MAX_HEIGHT
  }
  if (dw > MAX_WIDTH){
    dh = dh * MAX_WIDTH / dw
    dw = MAX_WIDTH
  }
  return {width: Math.round(dw), height: Math.round(dh)}
}

function getJpegSize(content, length){
  let offset = 2
  let dims

  do{
    const blockStart = content.slice(offset, offset + 4)
    if (blockStart[0] === 0xff && (blockStart[1] === 0xc0 || blockStart[1] == 0xc2)){
      // found block
      const block = content.slice(offset + 5, offset + 9)
      const height = (block[0] << 8) + block[1],
            width = (block[2] << 8) + block[3]
      dims = {width: width, height: height}
    }
    else{
      const blockSize = (blockStart[2] << 8 ) + blockStart[3]
      // console.log(`skip block ${blockSize} bytes`)
      offset += 2 + blockSize
    }
  }
  while(offset < length && !dims)
  return dims
}
