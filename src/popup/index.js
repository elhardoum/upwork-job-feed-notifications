(() =>
{
  const storage_get = (key) => new Promise((resolve) => chrome.storage.sync.get(key, resolve))
      , storage_set = (key, value) => new Promise((resolve) => chrome.storage.sync.set({[key]: value}, resolve))

  const form = document.forms[0], cont = form.children[0], remove = (event) =>
  {
    const container = event.target.parentElement.parentElement

    if ( cont.childElementCount > 1 ) {
      container.remove()
    } else {
      container.querySelectorAll('input').forEach(i => i.value = null)
    }
  }

  document.getElementById('add-new').addEventListener('click', () =>
  {
    cont.appendChild(cont.children[0].cloneNode(true))
    cont.lastElementChild.querySelector('.remove-pair').addEventListener('click', remove)
    cont.lastElementChild.querySelectorAll('input').forEach((i,x) =>
    {
      i.value = null
      x || i.focus()
    })
  })

  document.querySelector('.remove-pair').addEventListener('click', remove)
  
  form.removeAttribute('onsubmit')
  form.addEventListener('submit', event =>
  {
    event.preventDefault()

    let urls = [], feed_url

    if ( cont.childElementCount ) {
      for (let i=0; i<cont.childElementCount; i++) {
        feed_url = cont.children[i].querySelector('input').value.trim()
        feed_url && urls.push( feed_url )
      }
    }

    storage_set('urls', urls).then(() =>
    {
      const button = document.querySelector('[type="submit"]')
      button.dataset.originText = button.dataset.originText || button.textContent
      button.textContent = 'Saved!'
      setTimeout(() => button.textContent = button.dataset.originText, 1000)
    })
  })

  storage_get('urls').then(( { urls=[] } ) =>
  {
    if ( urls.length ) {
      urls.forEach((url, i) =>
      {
        i && document.getElementById('add-new').click()
        cont.lastElementChild.querySelector('input').value = url
      })
      document.activeElement && document.activeElement.blur()
    }
  })

  storage_get('off').then(({ off }) =>
  {
    const control = document.getElementById('control')
    control.style.display = ''

    if ( off ) {
      control.firstElementChild.style.display = 'block'
      control.lastElementChild.style.display = 'none'
    } else {
      control.firstElementChild.style.display = 'none'
      control.lastElementChild.style.display = 'block'
    }

    // update extension icon
    chrome.runtime.sendMessage({ update_icon_state: 1 })

    // update is_off state
    control.addEventListener('click', () => storage_set('off', !off).then(location.reload.bind(location)))
  })
})()