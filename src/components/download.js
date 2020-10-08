// Exports all data in a single file

import { repo } from '../storage.js'
import Utils from '../utils.js'

export async function download(e){
  const link = e.currentTarget
  let entries = await repo.getAll('entries')
  let images = await repo.getAll('images')

  // converts all pic blobs to base64
  await images.reduce(async (prom, img) => {
    await prom
    img.blob = await Utils.getBlobAsBase64(img.blob)
    return Promise.resolve()
  }, Promise.resolve())

  const data = {
    entries: entries,
    images: images
  }

  // serializes & base64 encodes data object
  link.href = 'data:application/json;charset=utf-8;base64,' + btoa(JSON.stringify(data))
}
