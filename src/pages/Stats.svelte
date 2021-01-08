<script>
  import {onMount, createEventDispatcher} from 'svelte'
  import {repo} from '../storage.js'
  import Chart from 'chart.js'
  const dispatch = createEventDispatcher()

  let entries = []

  $: bottleCount = entries.reduce((cur, e) => {return cur + e.count}, 0)

  onMount(async () => {
    // console.log('Stats mounted')
    await repo.open()
    load()
  })

  export async function load(){
    try{
      entries = await repo.getAll('entries')
      setColorChart()
    }
    catch(ex){
      console.error(ex)
      dispatch('notif', {text: 'Erreur de chargement', err: true})
    }
  }

  function setColorChart(){
    const data = []
    let totalCount = 0

    entries.forEach(e => {
      if (e.count > 0){
        const key = e.wine.color || 'N/A'
        let item = data.find(x => x.key === key)

        if (!item){
          item = {key: key, count: 0}
          data.push(item)
          switch(key){
            case 'red': item.color = '#a40e0e'
              break
            case 'white': item.color = '#ffea7a'
              break
            case 'rose': item.color = '#f78dad'
              break
            default: item.color = '#ccc'
          }
        }
        item.count += e.count
      }
    })

    data.sort((a, b) => {
      if (a.count > b.count) return -1
      else if (a.count < b.count) return 1
      else if (a.key === 'N/A') return 1
      else if (b.key === 'N/A') return -1
      return 0
    })

    // debugger
    const ctx = document.getElementById('colors').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'pie',
      data: {
        datasets: [{
          data: data.map(x => x.count),
          backgroundColor: data.map(x => x.color),
        }],
        labels: data.map(x => `${i18n.getString(x.key)} (${x.count})`)
      },
      options: {

      }
    })
  }
</script>

<h2>Stats</h2>

<div id="stats">
  <p><span class="bold">{bottleCount}</span> bouteilles dans <span class="bold">{entries.length}</span> références</p>

  <div class="chart-ctnr">
    <canvas id="colors" width="400" height="250"></canvas>
  </div>
</div>

<!-- pie chart couleur par entree, par bouteilles-->
<!-- pie chart region -->
<!-- nb bouteilles par entree -->

<style>
  h2{
    margin-bottom: 1em;
  }

  .chart-ctnr{
    width: 100%;
    margin-bottom: 4em;
  }
</style>
