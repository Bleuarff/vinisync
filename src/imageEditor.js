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
  console.debug(targetSize)

  try{
    const img = await getImage(file),
          canvas = document.createElement('canvas')

    console.debug('set canvas dimensions')
    canvas.width = targetSize.width
    canvas.height = targetSize.height

    console.debug('get context')
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, targetSize.width, targetSize.height)
    const newFile = await getBlob(ctx, file.type)
    URL.revokeObjectURL(img.src)
    return newFile
  }
  catch(ex){
    console.error(ex)
    return null
  }
}

function getBlob(ctx, mime){
  return new Promise((resolve, reject) => {
    ctx.canvas.toBlob(blob => {
      resolve(new Blob([blob], {type: mime}))
    }, mime, .92)
  })
}

function getImage(file){
  return new Promise(async (resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', e => {
      resolve(img)
    })
    img.src = URL.createObjectURL(file)
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
  let info = {width: 0, height: 0, orientation: 0, rotation: 0}
  let exifFound = false

  do{
    const header = raw.getUint16(offset, false), // block code
          blockLength = raw.getUint16(offset+2, false) // block size

    // SOF0 or SOF2 block
    if (header === 0xffc0 || header === 0xffc2){
      console.debug('size block at 0x' + offset.toString(16))
      const height = raw.getUint16(offset + 5, false),
            width = raw.getUint16(offset + 7, false)
      info.width = width
      info.height = height
      // console.debug(`w: ${width}   h: ${height}`)
    }
    // exif block
    else if (header === 0xffe1 && !exifFound){
      exifFound = true
      let soff = offset
      console.debug(`exif at 0x${offset.toString(16)}. length: ${blockLength.toString(10)}bytes`)
      if (raw.getUint32(soff+=4, false) !== 0x45786966){
        console.log('Invalid exif header')
      }
      else{
        const little = raw.getUint16(soff+=6, false) === 0x4949

        soff += raw.getUint32(soff + 4, little)
        const tagsCount = raw.getUint16(soff, little)
        soff += 2
        for (let i = 0; i < tagsCount; i++){
          if (raw.getUint16(soff + (i * 12), little) == 0x0112){
            info.orientation = raw.getUint16(soff + (i * 12) + 8, little)
            break
          }
        }
      }
    }

    // goto next block
    offset += 2 + blockLength
  }
  while(offset < length)

  // 1 = Horizontal (normal)
  // 2 = Mirror horizontal
  // 3 = Rotate 180
  // 4 = Mirror vertical
  // 5 = Mirror horizontal and rotate 270 CW
  // 6 = Rotate 90 CW
  // 7 = Mirror horizontal and rotate 90 CW
  // 8 = Rotate 270 CW
  switch (info.orientation){
    case 6:
    case 8:
      info.rotation = info.orientation === 6 ?-90 : -270;
      [info.width, info.height] = [info.height, info.width] // quarter-turn rotation: switch height & width
      break
    case 3:
      info.rotation = 180
      break
    case 1:
    default:
      info.rotation = 0
  }

  console.debug(info)
  return info
}
