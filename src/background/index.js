(() =>
{
  const INTERVAL_MS = 120 *1000 // by default update every 2 minutes
      , NOTIFICATIONS_DELAY = 5 *1000 // delay between multiple notifications
      , xml_parser = parser
      , storage = class Storage
      {
        static get(key)
        {
          return new Promise((resolve) => chrome.storage.sync.get(key, resolve))
        }

        static set(key, value)
        {
          return new Promise((resolve) => chrome.storage.sync.set({[key]: value}, resolve))
        }
      },
      id_urls = {}

  const fetch_jobs = async () =>
  {
    const { past_ids=[] } = await storage.get('past_ids')
        , { urls } = await storage.get('urls')

    urls && urls.length && urls.forEach(async url =>
    {
      const response = await fetch(url)
        .then(r => r.text())
        .then(j => xml_parser.parse(j))
        .catch(error => console.log(`${url} HTTP fetch ended with an error: ${error}`))

      const items = (response && response.rss && response.rss.channel ? response.rss.channel.item : [])
        .map(item =>
        {
          item._id = item.guid.match(/[a-f0-9]{6,}/)[0]
          id_urls[item._id] = item.link
          try {
            let rate = item.description.split('\n').filter(l => -1 !== l.toLowerCase().indexOf('<b>budget</b>: $')).shift().split(': ').pop()
            rate && rate.indexOf('$') >= 0 && (item._rate = rate)
          } catch (e) {}
          return item
        })
        .filter(item => ! past_ids || -1 == past_ids.indexOf(item._id) )
        
      items.forEach((item,i) =>
      {
        setTimeout(() => chrome.notifications.create(`${item._id}_${Math.random()}`, {
          title: `${ item._rate ? `${item._rate}: ` : '' }${item.title}`,
          message: item.description,
          iconUrl: '/icon.png',
          type: 'basic'
        }), i * NOTIFICATIONS_DELAY)
      })

      items.forEach(item => -1 == past_ids.indexOf(item._id) && past_ids.push(item._id))

      // persist notified ids to skip
      storage.set('past_ids', past_ids)
    })

  }

  // schedule runs
  setInterval(fetch_jobs, INTERVAL_MS)

  // inital run
  fetch_jobs()

  // notification opener
  chrome.notifications.onClicked.addListener(id =>
  {
    const link = id_urls[id.split('_').shift()]
    link && window.open(link)
  })
})()