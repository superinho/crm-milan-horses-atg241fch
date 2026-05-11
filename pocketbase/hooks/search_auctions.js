routerAdd(
  'POST',
  '/backend/v1/search/auctions',
  (e) => {
    const body = e.requestInfo().body || {}
    const queryText = body.query

    if (!queryText || typeof queryText !== 'string') {
      return e.badRequestError('Query text is required')
    }

    let queryVector
    try {
      const res = $http.send({
        url: $secrets.get('SKIP_AI_GATEWAY_URL') + '/v1/embeddings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + $secrets.get('SKIP_AI_GATEWAY_API_KEY'),
        },
        body: JSON.stringify({ input: queryText, model: 'embedding' }),
        timeout: 15,
      })

      if (
        res.statusCode !== 200 ||
        !res.json ||
        !res.json.data ||
        !res.json.data[0]
      ) {
        return e.internalServerError('Failed to compute embedding for query')
      }
      queryVector = res.json.data[0].embedding
    } catch (err) {
      return e.internalServerError('Failed to reach embedding service')
    }

    const EMBEDDING_DIMS = 1536
    if (!Array.isArray(queryVector) || queryVector.length !== EMBEDDING_DIMS) {
      return e.internalServerError('Invalid embedding dimension returned')
    }

    const kRaw = Number(body.k ?? 10)
    const k = Number.isFinite(kRaw)
      ? Math.min(Math.max(Math.trunc(kRaw), 1), 100)
      : 10

    const results = $vectors.search(e, 'auctions', {
      field: 'embedding',
      query: queryVector,
      k: k,
    })

    return e.json(200, results)
  },
  $apis.requireAuth(),
)
