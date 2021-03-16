<script>
  export let delay = 400

  let status = ''
  let transitionDelay = 200
  let id

  // TODO:(import) listen to messages to track progress.
  // event arg: {idx, total}

  export function show(){
      id = setTimeout(() => {
        status = 'transit'
        setTimeout(() => {
          status = 'visible'
        }, transitionDelay)
      }, delay)
  }

  export function hide(){
    clearTimeout(id)
    status = 'transit'
    setTimeout(() => {
      status = ''
    }, 200)
  }
</script>

<div id="loader" class={status} style="--transition-delay: {transitionDelay}ms">
  <div class="cloak">
  </div>
  <div id="anim">
  </div>
</div>

<style type="text/less">
  #loader{
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: none;
    transition: opacity var(--transition-delay);
    opacity: 0;
    background: transparent;
    z-index: 500;

    &.transit{
      display: block;
      opacity: 0;
    }

    &.visible{
      display: block;
      opacity: 1;
    }
  }

  .cloak{
    background: white;
    width: 100vw;
    height: 100vh;
    z-index: 10;
    opacity: .4;
  }

  #anim {
    display: inline-block;
    width: 50%;
    height: 50%;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);

    &:after {
      content: "";
      display: block;
      width: 48vw;
      height: 48vw;
      margin: 8px;
      border-radius: 50%;
      border-width: 30px;
      border-style: solid;
      border-color: var(--main-color) transparent var(--main-color) transparent;
      animation: lds-dual-ring 5s linear infinite;
      box-sizing: border-box;
      opacity: .85;
    }
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
