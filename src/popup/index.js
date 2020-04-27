(() =>
{
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

    chrome.storage.sync.set({ urls }, () =>
    {
      const button = document.querySelector('[type="submit"]')
      button.dataset.originText = button.dataset.originText || button.textContent
      button.textContent = 'Saved!'
      setTimeout(() => button.textContent = button.dataset.originText, 1000)
    })
  })

  chrome.storage.sync.get('urls', (urls) =>
  {
    urls = urls ? urls.urls : []
    if ( urls ) {
      urls.forEach((url, i) =>
      {
        i && document.getElementById('add-new').click()
        cont.lastElementChild.querySelector('input').value = url
      })
      document.activeElement && document.activeElement.blur()
    }
  })
})()