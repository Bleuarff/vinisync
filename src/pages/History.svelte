<script>
  import { onMount } from 'svelte'
  import { repo } from '../storage.js'
  import { DateTime } from 'luxon'
  import Chart from 'chart.js'
  export let params

  let updates = []
  let entry

  let link = {href: '/wines', title: 'Retour'}
  $: {
    if (params.id)
      link.href = '/entry/' + params.id
    if (entry && entry.wine){
      link.title = entry.wine.name
      if (entry.wine.name && entry.wine.producer)
        link.title += ' - '
      if (entry.wine.producer)
        link.title += entry.wine.producer
      if (entry.wine.year)
        link.title += ` (${entry.wine.year})`
    }
  }

  onMount(async () => {
    document.title += ' Historique'
    await repo.open()
    load()
  })

  export async function load(){
    if (params.id){
      const doc = await repo.findById('history', params.id)
      if (doc){
        updates = analyze(doc.edits)
        entry = await repo.findById('entries', params.id)
        document.title += ` ${entry.wine.name || entry.wine.producer}${entry.wine.year ?  ' ' + entry.wine.year : ''}`
      }
    }
    else{
      const docs = await repo.getAll('history')
      const entries = await repo.getAll('entries')
      docs.forEach(doc => {
        const refEntry = entries.find(x => x.id === doc.entryId)
        updates = updates.concat(analyze(doc.edits, refEntry)) // populate global list of updates
      })
      updates = updates.sort(sortByDate)
    }
    createChart()
  }

  // adds metadata from a list of changes for a single entry.
  function analyze(changeList, refEntry){
    changeList = changeList.sort(sortByDate)

    for (let i = 0; i < changeList.length; i++){
      const change = changeList[i].change
      if (change.count != null){ // can be 0
        // find previous element with count
        const prev = changeList.slice(i+1).find(x => x.change.count != null)
        if (prev){
          change.countDiff = change.count - prev.change.count
          // console.log(change)
        }
      }

      // populate with entry data (in global view)
      if (refEntry){
        change.wine = change.wine || {}
        change.wine.name = change.wine.name || refEntry.wine.name
        change.wine.producer = change.wine.producer || refEntry.wine.producer
        change.wine.year = change.wine.year || refEntry.wine.year
        changeList[i]._entryId = refEntry.id
      }
    }
    return changeList
  }

  function createChart(){
    const ctx = document.getElementById('chart')
    let datapoints
    if (params.id){
      datapoints = updates.filter(x => x.change.count != null).reverse().map(x => {return {
        t: x.ts,
        y: x.change.count
      }})
    }
    else {
      datapoints = getGlobalCounts()
    }

    // add last point with current time and same value as initial last point
    datapoints.push({
      t: DateTime.local().toISO(),
      y: datapoints[datapoints.length-1].y
    })

    let color = '#ba0e0e',
        fillColor = '#ba0e0e40'
    if (entry && entry.wine && entry.wine.color){
      if (entry.wine.color === 'white'){
        color = '#f1d125'
        fillColor = '#f1d12540'
      }
      else if (entry.wine.color === 'rose'){
        color = '#e46289'
        fillColor = '#e4628940'
      }
    }

    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: false,
                data: datapoints,
                steppedLine: 'before',
                borderWidth: 2,
                borderColor: color,
                backgroundColor: fillColor,
                pointRadius: 2
            }]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              type: 'time',
              time: {
                displayFormats:
                {
                  millisecond: 'DD/MM/YYYY',
                  second: 'DD/MM/YYYY',
                  minute: 'DD/MM/YYYY',
                  hour: 'DD/MM/YYYY',
                  day: 'DD/MM/YYYY',
                  week: 'DD/MM/YYYY',
                  month: 'DD/MM/YYYY',
                  quarter: 'DD/MM/YYYY',
                  year: 'DD/MM/YYYY',
                },
                tooltipFormat: 'DD/MM/YYYY',
              },
              ticks: {
                source: 'data'
              },
            }],
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    stepSize: params.id ? 1 : 20
                }
            }]
          }
        },
    })
  }

  // returns data for global history with bottle counts.
  function getGlobalCounts(){
    const changes = updates.filter(x => x.change.count != null).reverse(),
          map = new Map(), // store count by entryId
          datapoints = []

    changes.forEach(change => {
      // udpate map with count for entry, whether new or update,
      // then iterates over map to get total count at this point.
      map.set(change._entryId, change.change.count)
      let count = 0
      for (const c of map.values())
        count += c

      datapoints.push({
        t: change.ts,
        y: count
      })
    })

    return datapoints
  }

  function formatChange(change){
    const t = typeof change
    if (t === 'string')
      return change
    else if (t === 'object')
      return JSON.stringify(change)
  }

  // sort by descending date
  function sortByDate(a, b){
    if (a.ts < b.ts) return 1
    else if (a.ts > b.ts) return -1
    return 0
  }
</script>

{#if link}
  <a href={link.href} class="back" title={link.title}>{link.title}</a>
{/if}

<div id="history">

  <div id="chart-ctnr">
    <canvas id="chart" width="400" height="250"></canvas>
  </div>

  {#if updates && updates.length > 0}
    <table>
      <thead>
        <th>Heure</th>
        <th>Modification</th>
      </thead>
      <tbody>
        {#each updates as update}
          <tr>
            <td class="ts">{DateTime.fromISO(update.ts).toFormat('dd/LL/yyyy HH:mm')}</td>
            <td class="change">
              <div class="diff-ctnr">
                {#if update.change.creationDate}<span>NEW</span>{/if}
                {#if update.change.countDiff}
                  <span class="count-diff">{update.change.countDiff > 0 ? '+' :''}{update.change.countDiff}</span>
                  <span class="count">[{update.change.count}]</span>
                {:else if update.change.count}
                  <span class="count">[{update.change.count}]</span>
                {/if}
                {#if update.change.wine}
                  {#if update.change.wine.name}
                    <span class="name">{update.change.wine.name}</span>
                  {/if}

                  {#if (update.change.wine.producer && update.change.wine.name)}<span> - </span>{/if}

                  {#if update.change.wine.producer}
                    <span class="producer">{update.change.wine.producer}</span>
                  {/if}
                  {#if update.change.wine.year}
                    <span class="year">({update.change.wine.year})</span>
                  {/if}
                {/if}
              </div>
              <!-- {formatChange(update.change)} -->
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <div class="empty">
      Aucune modification enregistrée.
    </div>
  {/if}
</div>

<style>
  #history{
    margin-top: 2em;
  }
  table{
    width: 100%;
    font-size: .844em;
    border-collapse: collapse;
  }
  .ts{
    white-space: nowrap;
    vertical-align: top;
  }
  .change{
    padding-left: 1em;
    width: 100%;
  }
  tr:nth-child(2n+1){
    background: #eeeeee;
  }
  td{
    padding: 3px 0;
  }
  td:first-child{
    padding-left: 6px;
  }
  td:last-child{
    padding-right: 6px;
  }

  .empty{
    margin: 3em 1em 1em 1em;
    padding: 2em;
    text-align: center;
    border: 1px solid var(--main-color);
  }

  .back{
    display: inline-block;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  #chart-ctnr{
    width: 100%;
    /* height: 220px; */
    margin-bottom: 3em;
  }
</style>
