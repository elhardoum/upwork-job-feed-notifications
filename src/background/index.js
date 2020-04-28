(() =>
{
  const INTERVAL_MS = 60 *1000 // by default update every minute
      , NOTIFICATIONS_DELAY = 5 *1000 // delay between multiple notifications
      , xml_parser = parser
      , storage_get = (key) => new Promise((resolve) => chrome.storage.sync.get(key, resolve))
      , storage_set = (key, value) => new Promise((resolve) => chrome.storage.sync.set({[key]: value}, resolve))
      , id_urls = {}

  const fetch_jobs = async () =>
  {
    if ( (await storage_get('off') || {}).off ) // extension disabled
      return

    const { past_ids=[] } = await storage_get('past_ids')
        , { urls } = await storage_get('urls')

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
          try {
            let rate = item.description.split('\n').filter(l => -1 !== l.toLowerCase().indexOf('<b>budget</b>: $')).shift().split(': ').pop()
            rate && rate.indexOf('$') >= 0 && (item._rate = rate)
          } catch (e) {}
          return item
        })
        .filter(item => ! past_ids || -1 == past_ids.indexOf(item._id) )
        
      items.forEach((item,i) =>
      {
        setTimeout(() => chrome.notifications.create(Math.random().toString(), {
          title: `${ item._rate ? `${item._rate}: ` : '' }${item.title}`,
          message: item.description,
          iconUrl: '/icon.png',
          type: 'basic'
        }, notifId => id_urls[notifId]=item.link), i * NOTIFICATIONS_DELAY)
      })

      items.forEach(item => -1 == past_ids.indexOf(item._id) && past_ids.push(item._id))

      // persist notified ids to skip later
      // store last 1000 ids to avoid redundant data storage
      storage_set('past_ids', past_ids.slice(Math.max(0, past_ids.length - 1000)))
    })
  }

  // schedule runs
  setInterval(fetch_jobs, INTERVAL_MS)

  // inital run
  fetch_jobs()

  // notification opener
  chrome.notifications.onClicked.addListener(id => id_urls[id] && window.open(id_urls[id]))

  // update extension icon based on on/off state
  const update_icon = async () =>
  {
    const is_off = (await storage_get('off') || {}).off
    chrome.browserAction.setIcon({ path: `/icon${ is_off ? '-off' : '' }.png` })
  }

  // intercepting extension messages
  chrome.runtime.onMessage.addListener((message, sender) =>
  {
    'update_icon_state' in message && update_icon()
    return true
  })

  // update extension icon
  update_icon()
})()