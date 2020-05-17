<script>
  import { onMount, onDestroy} from 'svelte'
  import { repo } from '../storage.js'
  import { resize } from '../imageEditor.js'
  import { v4 as uuid} from 'uuid'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  export let entryId = ''
  export let edit = false

  let imageUrl = null // data-url to image file
  let file = null // file object returned by file importer
  let imgDoc = null // db doc
  let fullSizeImg = false

  let importer // fileImporter node

  // returns true if everything is ok, false otherwise
  export async function save(entryId){
    if (!file || !entryId) return

    try{
      const data = await file.arrayBuffer(),
            imgBlob = new Blob([data])

      if (imgDoc){
        // TODO modified image
      }
      else
      {
        // new image for new or existing entry
        imgDoc = {
          id: uuid(),
          entryId: entryId,
          blob: imgBlob
        }
        repo.insertOne('images', imgDoc)
        file = null // won't overwrite file if click again without any other file upload
      }

      return true
    }
    catch(ex){
      console.error(ex)
      return false
    }
  }

  onMount(async () => {
    console.log('onMount')
    await repo.open()
    if (entryId){
      // fetch image for the entry
      console.log('get image for entry ' + entryId)
      repo.findOne('images', x => { return x.entryId === entryId })
      .then(imgDoc => {
        if (!imgDoc) return
        imageUrl = URL.createObjectURL(imgDoc.blob)
      })
    }
  })

  onDestroy(() => {
    console.log('revoke img url')
    // release image data when unmounting component
    if (imageUrl)
      URL.revokeObjectURL(imageUrl)
  })

  // load image file
  async function addPicture(e){
    try{
      const rawFile = e.currentTarget.files[0]
      if (!rawFile.type.startsWith('image/')){
        dispatch('notif', {text: 'Le fichier selectionné n\'est pas une image' , err: true})
        return
      }
      file = await resize(rawFile)
      console.debug(`Resized image size: ${file.size}`)
      // fileSize = (file.size / 1e3).toFixed(1)
      imageUrl = URL.createObjectURL(file)
    }
    catch(ex){
      console.error(ex)
      dispatch('notif', {text: 'Erreur de lecture de l\'image', err: true})
    }
  }

  export function clear(){
    URL.revokeObjectURL(imageUrl)
    imageUrl = null
  }

  let angle = 90
  function toggleOrRotate(e){
    if (!fullSizeImg)
      fullSizeImg = true
    else{
      e.currentTarget.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`
      // console.debug('rotate ' + angle)
      angle = (angle + 90) % 360
    }
  }

  function resetFullsize(){
    fullSizeImg = false
  }

</script>

{#if imageUrl || edit}
  <div class="image-editor">
    {#if imageUrl}
      <!-- TODO: if edit, onclick on image to change it (change/remove/rotate) -->
      <img src={imageUrl} class="centered" class:fullSize={fullSizeImg} on:click="{toggleOrRotate}" on:dblclick="{resetFullsize}">
      {#if edit && file}<span class="filesize">{(file.size / 1e3).toFixed(0)} kb</span>{/if}
      <div class="img-background" class:fullSize={fullSizeImg} on:click="{resetFullsize}"></div>
    {:else if edit}
      <span class="icon-camera btn centered" on:click="{importer.click()}"></span>
      <input type="file" bind:this={importer} class="importer" on:change={addPicture} accept="image/*" >
    {/if}
  </div>
{/if}

<style>
  .image-editor{
    flex: 0 0 100px;
    height: 150px;
    margin-right: 1em;
    position: relative;
    /* background: #8b8b8b; */
  }

  @media(min-width: 500px){
    .image-editor{
      flex-basis: 140px;
      height: 210px;
    }
  }

  .centered{
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  input{
    display: none;
  }
  .btn{
    cursor: pointer;
    font-size: 1.5em;
  }

  img{
    max-width: 100%;
    max-height: 100%;
  }

  img.fullSize{
    position: fixed;
    left: 50vw;
    top: 50vh;
    max-width: 100vw;
    max-height: 100vh;
    z-index: 1000;
    transform: translate(-50%, -50%);
  }

  .img-background{
    display: none;
  }
  .img-background.fullSize{
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #494949;
    opacity: .8;
    z-index: 900;
  }

  .filesize{
    position: absolute;
    right: 0;
    bottom: 0;
    color: #202020;
    background: white;
    border-radius: 2px;
    font-size: .8em;
    padding: .1em .2em;
  }
</style>
