<script>
  import { onDestroy} from 'svelte'
  import { repo } from '../storage.js'
  import { resize } from '../imageEditor.js'
  import syncMgr from '../syncMgr.js'
  import { v4 as uuid} from 'uuid'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  export let entryId = ''
  export let edit = false

  let imageUrl = null // data-url to image file
  let file = null // file object returned by file importer
  let refPic = null // db doc
  let fullSizeImg = false
  let filesize = 0
  let rotation = 0 // picture rotation angle

  $: imgStyle = `transform: translate(-50%, -50%) rotate(${rotation}deg)`

  let importer // fileImporter node

  // returns true if everything is ok, false otherwise
  export async function save(entryId){
    const canSave = entryId && (file || (refPic && refPic.rotation !== rotation))
    if (!canSave)
      return true

    try{
      let data, imgBlob, imgDoc

      if (file){
        data = await file.arrayBuffer()
        imgBlob = new Blob([data])
      }

      if (refPic){
        const modifs = { rotation: rotation}
        if (imgBlob)
          modifs.blob = imgBlob

        imgDoc = await repo.updateOne('images', refPic.id, modifs)
      }
      else{
        imgDoc = {
          id: uuid(),
          entryId: entryId,
          blob: imgBlob,
          rotation: rotation
        }
        imgDoc = await repo.insertOne('images', imgDoc)
      }
      file = null // won't overwrite file if click again without any other file upload

      console.log('sync update: picture')

      syncMgr.syncIt(imgDoc, refPic, 'picture')

      return true
    }
    catch(ex){
      console.error(ex)
      return false
    }
  }

  // release image data when unmounting component
  onDestroy(() => {
    if (imageUrl)
      URL.revokeObjectURL(imageUrl)
    document.body.style.overflow = 'visible'
  })

  export async function load(entryId){
    if (entryId){
      // fetch image for the entry
      try{
        refPic = await repo.findOne('images', x => { return x.entryId === entryId })
        if (refPic){
          imageUrl = URL.createObjectURL(refPic.blob)
          filesize = refPic.blob.size
          rotation = refPic.rotation || 0
        }
        else{
          imageUrl = null
          rotation = filesize = 0
        }
      }
      catch(ex){
        dispatch('notif', {text: `Erreur de récuperation de l'image`, err: true})
      }
    }
  }

  // load image file
  async function addPicture(e){
    try{
      const rawFile = e.currentTarget.files[0]

      if (!rawFile) return
      if (!rawFile.type.startsWith('image/')){
        dispatch('notif', {text: 'Le fichier selectionné n\'est pas une image' , err: true})
        return
      }
      console.debug('Resize image')
      file = await resize(rawFile)

      if (file == null){
        dispatch('notif', {text: 'Erreur de redimensionnement de l\'image' , err: true})
        return
      }

      console.debug(`Resized image size: ${file.size}`)
      imageUrl = URL.createObjectURL(file)
      filesize = file.size
      rotation = 0
    }
    catch(ex){
      console.error(ex)
      dispatch('notif', {text: 'Erreur de lecture de l\'image', err: true})
    }
  }

  export function clearEdit(){
    if (file){
      URL.revokeObjectURL(imageUrl)
      if (entryId)
        load(entryId)
    }
  }

  function toggleOrRotate(e){
    if (!fullSizeImg){
      fullSizeImg = true
      document.body.style.overflow = 'hidden'
    }
    else{
      rotation = (rotation + 90) % 360
    }
  }

  function resetFullsize(){
    fullSizeImg = false
    document.body.style.overflow = 'visible'
  }

  function changeImage(){
    if (!edit) return
    importer.click()
  }

</script>

{#if imageUrl || edit}
  <div class="image-editor" class:fullSize={fullSizeImg} class:quarter-rotation="{rotation % 180}" style="--fullsizeMaxWidth: 85{!!(rotation % 180) ? 'vh' : 'vw'}; --fullsizeMaxHeight: 85{!!(rotation % 180) ? 'vw' : 'vh'};">
    {#if imageUrl}
      <img src={imageUrl} class="centered" class:fullSize={fullSizeImg} on:click="{toggleOrRotate}" on:dblclick="{changeImage}"
        style={imgStyle} alt="image pour cette entrée">
      {#if edit}<span class="filesize">{(filesize / 1e3).toFixed(0)}kb</span>{/if}
      <div class="img-background" class:fullSize={fullSizeImg} on:click="{resetFullsize}"></div>
    {:else if edit}
      <span class="icon-camera btn centered" on:click="{importer.click()}"></span>
    {/if}
  </div>
{/if}
<input type="file" bind:this={importer} class="importer" on:change={addPicture} accept="image/*" >

<style>
  .image-editor{
    flex: 0 0 100px;
    height: 150px;
    margin-right: 1em;
    position: relative;
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

  .quarter-rotation img:not(.fullSize){
    max-height: calc(100px + 1em);
    transform-origin: calc(50% + .5em) center;
  }

  img.fullSize{
    position: fixed;
    left: 50vw;
    top: 50vh;
    max-width: var(--fullsizeMaxWidth);
    max-height: var(--fullsizeMaxHeight);
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

  @media(min-width: 500px){
    .image-editor{
      flex-basis: 140px;
      height: 210px;
    }

    .quarter-rotation img:not(.fullSize){
      max-height: calc(140px + 1em);
      transform-origin: calc(50% + .5em) center;
    }
  }
</style>
