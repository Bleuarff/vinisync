<script>
  export let delay = 400

  let visible = false
  let id

  // TODO:(import) listen to messages to track progress.
  // event arg: {idx, total}

  export function show(){
      id = setTimeout(() => {
        visible = true
      }, delay)
  }

  export function hide(){
    clearTimeout(id)
    visible = false
  }
</script>

<!-- {#if visible} -->
  <div id="loader" class:visible>
    <div class="cloak">
    </div>
    <div id="anim">
    </div>
  </div>
<!-- {/if} -->

<style type="text/less">
  #loader{
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 500;
    display: none;
    transition: opacity .2s;
    opacity: 0;

    &.visible{
      display: block;
      opacity: .6;
    }
  }

  .cloak{
    background: rgb(52, 52, 52, .6);
    width: 100%;
    height: 100%;
  }

  #anim {
    display: inline-block;
    width: 50%;
    height: 50%;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
    #anim:after {
      content: " ";
      display: block;
      width: 48vw;
      height: 48vw;
      margin: 8px;
      border-radius: 50%;
      border: 30px solid #fff;
      border-color: #fff transparent #fff transparent;
      animation: lds-dual-ring 5s linear infinite;
      box-sizing: border-box;
    }
    @keyframes lds-dual-ring {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
</style>
