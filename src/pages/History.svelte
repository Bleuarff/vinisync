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
      link.href = 'javascript:history.back()'
    if (entry && entry.wine){
      link.title = entry.wine.name || ''
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
      const docs = await repo.getAllFromIndex('updates', 'entryId',  params.id)
      if (docs){
        updates = analyze(docs)
        entry = await repo.findById('entries', params.id)
        document.title += ` ${entry.wine.name || entry.wine.producer}${entry.wine.year ?  ' ' + entry.wine.year : ''}`
      }
    }
    else{
      const entries = await repo.getAll('entries')
      await entries.reduce(async (prom, entry) => {
        await prom
        const docs = await repo.getAllFromIndex('updates', 'entryId', entry.id)
        if (docs?.length)
          updates = updates.concat(analyze(docs, entry)) // populate global list of updates
      }, Promise.resolve())
      updates = updates.sort(sortByDate)
    }

    if (updates.length > 0)
      createChart()
  }

  // adds metadata from a list of changes for a single entry.
  function analyze(updates, refEntry){
    updates = updates.sort(sortByDate)

    for (let i = 0; i < updates.length; i++){
      const changes = updates[i].changes
      if (changes.count != null){ // can be 0
        // find previous element with count
        const prev = updates.slice(i+1).find(x => x.changes.count != null)
        if (prev){
          changes.countDiff = changes.count - prev.changes.count
          // console.log(changes)
        }
      }

      // populate with entry data (in global view)
      if (refEntry){
        changes.wine = changes.wine || {}
        changes.wine.name = changes.wine.name || refEntry.wine.name
        changes.wine.producer = changes.wine.producer || refEntry.wine.producer
        changes.wine.year = changes.wine.year || refEntry.wine.year
        changes.wine.color = changes.wine.color || refEntry.wine.color
        updates[i]._entryId = refEntry.id
      }
    }
    return updates
  }

  function createChart(){
    const ctx = document.getElementById('chart')
    let datapoints
    if (params.id){
      datapoints = updates.filter(x => x.changes.count != null).reverse().map(x => {return {
        t: x.ts,
        y: x.changes.count
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
                  day: 'DD/MM/YY',
                  month: 'MM/YY',
                  quarter: 'MM/YY',
                  year: 'YYYY'
                },
                tooltipFormat: 'DD/MM/YYYY',
              },
              ticks: {
                source: entry ? 'data' : 'auto'
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
    const changes = updates.filter(x => x.changes.count != null).reverse(),
          map = new Map(), // store count by entryId
          datapoints = []

    changes.forEach(upd => {
      // udpate map with count for entry, whether new or update,
      // then iterates over map to get total count at this point.
      map.set(upd._entryId, upd.changes.count)
      let count = 0
      for (const c of map.values())
        count += c

      datapoints.push({
        t: upd.ts,
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

  // returns evolution arrow rotation factor, based on update count/diff.
  function getEvolutionFactor(changes){
    const ratio = changes.countDiff || changes.count || 0
    return Math.max(Math.min(ratio, 6), -6)
  }
</script>

{#if link}
  <a href={link.href} class="back" title={link.title}>{link.title}</a>
{/if}

<div id="history">

  {#if updates && updates.length > 0}
    <div id="chart-ctnr">
      <canvas id="chart" width="400" height="250"></canvas>
    </div>

    <table>
      <thead>
        <th>Heure</th>
        <th class="evolution"></th>
        <th class="change">Modification</th>
      </thead>
      <tbody>
        {#each updates as update}
          <tr>
            <td class="ts">{DateTime.fromISO(update.ts).toFormat('dd/LL/yyyy HH:mm')}</td>
            <td class="evolution">
              <span class="arrow" style="--qt:{getEvolutionFactor(update.changes)};">→</span>
            </td>
            <td class="change">
              <div class="diff-ctnr">

                {#if update.changes.countDiff}
                  <span class="count-diff">{update.changes.countDiff > 0 ? '+' :''}{update.changes.countDiff}</span>
                  <span class="count">[{update.changes.count}]</span>
                {:else if update.changes.count}
                  <span class="count">[{update.changes.count}]</span>
                {/if}
                {#if update.changes.wine}
                  {#if update.changes.wine.name}
                    <span class="name">{update.changes.wine.name}</span>
                  {/if}

                  {#if (update.changes.wine.producer && update.changes.wine.name)}<span> - </span>{/if}

                  {#if update.changes.wine.producer}
                    <span class="producer">{update.changes.wine.producer}</span>
                  {/if}
                  {#if update.changes.wine.year}
                    <span class="year">({update.changes.wine.year})</span>
                  {/if}
                {/if}
              </div>
              <!-- {formatChange(update.changes)} -->
            </td>

            {#if !entry}
              <td class="entry-link">
                <a href="/entry/{update._entryId}?fh=1" class="{update.changes?.wine?.color}" title="Voir cette entrée">&#x25b6;</a>
              </td>
            {/if}

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

<style lang="less">
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
    width: 100%;
  }
  tr:nth-child(2n+1){
    background: #eeeeee;
  }
  td{
    padding: 4px 0;
  }
  td:first-child{
    padding-left: 6px;
  }
  td:last-child{
    padding-right: 6px;
  }

  .evolution{
    min-width: 3em;
    text-align: center;
    vertical-align: top;

    .arrow{
      display: inline-block;
      transform: rotate(calc(-15deg * var(--qt, 0))) scale(1.2);
      opacity: max(var(--qt), calc(-1 * var(--qt)));
    }
  }

  td a{
    color: #3e3e3e;
    text-decoration: none;
  }

  td.entry-link{
    .red {
      color: var(--wine-red);
    }
    .white {
      color: var(--wine-white);
      -webkit-text-stroke: 1px #636363;
    }
    .rose {
      color: var(--wine-rose);
    }
  }

  .empty{
    margin: 8em 1em 1em 1em;
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
