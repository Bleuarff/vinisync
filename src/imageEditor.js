const MAX_FILE_SIZE = 500 * 1024,
      MAX_WIDTH = 1000,
      MAX_HEIGHT = 1000

export async function resize(file){
  // Resize method & size validation
  if (file.size <= MAX_FILE_SIZE){
    console.debug(`file is small enough (${file.size})`)
    return file
  }

  let infos
  if (file.type === 'image/jpeg')
    infos = getJpegSize(new DataView(await file.arrayBuffer()), file.size)
  else
    // TODO: png support
    throw new Error('Image format resize not supported')

  const targetSize = getDesiredSize(infos)

  const img = await getImage(file),
        canvas = document.createElement('canvas')

  canvas.width = targetSize.width
  canvas.height = targetSize.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, targetSize.width, targetSize.height)
  const newFile = await getBlob(ctx, file.type)
  return newFile
}

function getBlob(ctx, mime){
  return new Promise((resolve, reject) => {
    ctx.canvas.toBlob(blob => {
      resolve(new Blob([blob], {type: mime}))
    }, mime, .92)
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

function getJpegSize(raw, length){
  let offset = 2 // offset of block address, from start of file
  let info = {width: 0, height: 0, rotation: 0}
  // let exifFound = false

  do{
    const header = raw.getUint16(offset, false), // block code
          blockLength = raw.getUint16(offset+2, false) // block size

    if (header === 0xffc0 || header === 0xffc2){
      console.debug('size block at 0x' + offset.toString(16))
      const height = raw.getUint16(offset + 5),
            width = raw.getUint16(offset + 7)
      info.width = width
      info.height = height
      console.debug(`w: ${width}   h: ${height}`)
    }
    // exif block
    // else if (header === 0xffe1 && !exifFound){
    //   let soff = offset
    //   exifFound = true
    //   console.log(`exif at 0x${offset.toString(16)}. length: ${blockLength.toString(10)}bytes`)
    //   if (raw.getUint32(soff+=4) !== 0x45786966){
    //     console.log('Invalid exif header')
    //   }
    //   else{
    //     const little = raw.getUint16(soff+=6) === 0x4949
    //     console.debug('little endian: ' + little)
    //
    //   }
    // }

    // goto next block
    offset += 2 + blockLength
  }
  while(offset < length)
  return info
}
