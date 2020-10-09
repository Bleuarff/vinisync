<script>
// Exports all data in a single file
import { tick } from 'svelte'
import { repo } from '../storage.js'
import Utils from '../utils.js'
import {DateTime} from 'luxon'


let ready = false
let filename = 'backup.json'


async function download(e){
  // retrieve everything
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
  const output = 'data:application/json;charset=utf-8;base64,' + btoa(JSON.stringify(data))

  ready = true
  // await tick() // waits for download link to appear

  // assign url to new node & click it for immediate download
  const target = document.getElementById('download-link')
  target.href = output
  const ts = DateTime.local().toFormat('yyyyMddHHmm') // to string
  filename = `vinisync_backup_${ts}.json `
  await tick()
  target.click()
  ready = false
}
</script>

<a href="#" class="icon-download" title="Télécharger un backup" on:click={download}> </a>

<a href="#" id="download-link" class="hidden" download={filename}>backup link</a>

<style>
  a{
    color: white;
  }
</style>
