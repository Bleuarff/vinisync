<script>
  import {onMount, createEventDispatcher} from 'svelte'
  import {repo} from '../storage.js'
  import Chart from 'chart.js'
  const dispatch = createEventDispatcher()

  let entries = []

  $: bottleCount = entries.reduce((cur, e) => {return cur + e.count}, 0)

  onMount(async () => {
    document.title += ' Stats'
    await repo.open()
    load()
  })

  export async function load(){
    try{
      entries = await repo.getAll('entries')
      entries = entries.filter(x => x.count > 0)
      setColorChart()
      setEntryChart()
      setYearChart()
    }
    catch(ex){
      console.error(ex)
      dispatch('notif', {text: 'Erreur de chargement', err: true})
    }
  }

  function setEntryChart(){
    const data = entries.map(x => {return {
      bottles: x.count,
      color: x.wine.color,
      label: x.wine.name || x.wine.producer
    }}).sort((a, b) => {
      if (a.bottles < b.bottles)
        return -1
      else if (a.bottles > b.bottles)
        return 1
      return 0
    })
    // debugger

    const ctx = document.getElementById('volumes-entries').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        datasets: [{
          data: data.map(x => x.bottles),
          backgroundColor: data.map(x => getColor(x.color)),
        }],
        labels: data.map(x => x.label)

      },
      options: {
        scales: {
          xAxes: [{
            type: 'category',
            display: false
          }],
          yAxes: [{
            ticks: {
              min: 0,
              stepSize: 2
            }
          }]
        },
        legend: {
          display: false
        }
      }
    })
  }

  function setYearChart(){
    let data = []

    entries.forEach(e => {
      const key = (e.wine.year || 'N/A').toString()
      let item = data.find(x => x.key === key)

      if (!item){
        item = {key: key, count: 0}
        data.push(item)
      }
      item.count += e.count
    })

    data.sort((a, b) => {
      if (a.key === 'N/A') return 1
      else if (b.key === 'N/A') return -1
      else if (a.key < b.key) return 1
      else if (a.key > b.key) return -1
      return 0
    })
    const maxItems = 10
    if (data.length > maxItems){
      data = data.reduce((list, cur, i) => {
        if (i < maxItems)
          list.push(cur)
        else
          list[maxItems - 1].count += cur.count
        return list
      }, [])
      data[maxItems - 1].key = 'Autres'
    }

    const ctx = document.getElementById('years').getContext('2d')
    const chart = new Chart(ctx, {
      type: 'pie',
      data: {
        datasets: [{
          data: data.map(x => x.count),
          backgroundColor: ['#f90e0e', '#F47A1F', '#FDBB2F', '#377B2B', '#7AC142', '#acf70b', '#007CC3', '#00529B', '#23cdaf']
        }],
        labels: data.map(x => x.key)
      }
    })
  }

  function setColorChart(){
    const data = []

    entries.forEach(e => {
      const key = e.wine.color || 'N/A'
      let item = data.find(x => x.key === key)

      if (!item){
        item = {key: key, count: 0}
        data.push(item)
        item.color = getColor(key)
      }
      item.count += e.count
    })

    data.sort((a, b) => {
      if (a.count > b.count) return -1
      else if (a.count < b.count) return 1
      else if (a.key === 'N/A') return 1
      else if (b.key === 'N/A') return -1
      return 0
    })

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

  function getColor(name){
    let color
    switch(name){
      case 'red': color = '#a40e0e'
        break
      case 'white': color = '#ffea7a'
        break
      case 'rose': color = '#f78dad'
        break
      default: color = '#ccc'
    }
    return color
  }
</script>

<h2>Stats</h2>

<div id="stats">
  <p><span class="bold">{bottleCount}</span> bouteilles dans <span class="bold">{entries.length}</span> références</p>

  <div class="chart-ctnr">
    <label>Répartition par couleur des vins</label>
    <canvas id="colors" width="400" height="250"></canvas>
  </div>
</div>

<div class="chart-ctnr">
  <label>Volume des entrées</label>
  <canvas id="volumes-entries" width="400" height="250"></canvas>
</div>

<div class="chart-ctnr">
  <label>Répartition par millésime</label>
  <canvas id="years" width="400" height="250"></canvas>
</div>

<!-- TODO: pie chart region -->

<style>
  h2{
    margin-bottom: 1em;
  }

  .chart-ctnr{
    width: 100%;
    margin-bottom: 5em;
  }

  label{
    font-size: 1.1em;
    font-weight: bold;
    margin-bottom: .6em;
    text-align: center;
  }
</style>
