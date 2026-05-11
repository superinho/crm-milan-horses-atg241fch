onRecordAfterCreateSuccess((e) => {
  const record = $app.findRecordById('auctions', e.record.id)
  const title = record.getString('title') || ''
  const status = record.getString('status') || ''
  const text = `Auction: ${title}. Status: ${status}.`

  try {
    const res = $http.send({
      url: $secrets.get('SKIP_AI_GATEWAY_URL') + '/v1/embeddings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + $secrets.get('SKIP_AI_GATEWAY_API_KEY'),
      },
      body: JSON.stringify({ input: text, model: 'embedding' }),
      timeout: 15,
    })

    if (
      res.statusCode === 200 &&
      res.json &&
      res.json.data &&
      res.json.data[0]
    ) {
      record.set('embedding', res.json.data[0].embedding)
      $app.saveNoValidate(record)
    }
  } catch (err) {
    $app
      .logger()
      .error('Failed to embed auction on create', 'error', err.message)
  }

  e.next()
}, 'auctions')

onRecordAfterUpdateSuccess((e) => {
  const record = $app.findRecordById('auctions', e.record.id)
  const origTitle = e.record.original().getString('title')
  const origStatus = e.record.original().getString('status')
  const newTitle = record.getString('title')
  const newStatus = record.getString('status')

  if (
    origTitle === newTitle &&
    origStatus === newStatus &&
    record.get('embedding')
  ) {
    return e.next()
  }

  const text = `Auction: ${newTitle}. Status: ${newStatus}.`

  try {
    const res = $http.send({
      url: $secrets.get('SKIP_AI_GATEWAY_URL') + '/v1/embeddings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + $secrets.get('SKIP_AI_GATEWAY_API_KEY'),
      },
      body: JSON.stringify({ input: text, model: 'embedding' }),
      timeout: 15,
    })

    if (
      res.statusCode === 200 &&
      res.json &&
      res.json.data &&
      res.json.data[0]
    ) {
      record.set('embedding', res.json.data[0].embedding)
      $app.saveNoValidate(record)
    }
  } catch (err) {
    $app
      .logger()
      .error('Failed to re-embed auction on update', 'error', err.message)
  }

  e.next()
}, 'auctions')
