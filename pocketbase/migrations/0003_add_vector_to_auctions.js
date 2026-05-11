migrate(
  (app) => {
    // VectorField is not exposed in the JSVM bindings, so we recreate the collection
    // using a plain object which bypasses the typed constructors.
    let col
    try {
      col = app.findCollectionByNameOrId('auctions')
      app.delete(col)
    } catch (_) {}

    const collection = new Collection({
      name: 'auctions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'external_id', type: 'text' },
        { name: 'title', type: 'text', required: true },
        { name: 'value', type: 'number' },
        { name: 'status', type: 'text' },
        { name: 'source_url', type: 'url' },
        { name: 'embedding', type: 'vector', dimensions: 1536 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_auctions_external_id ON auctions (external_id)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('auctions')
      app.delete(col)
    } catch (_) {}

    const collection = new Collection({
      name: 'auctions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'external_id', type: 'text' },
        { name: 'title', type: 'text', required: true },
        { name: 'value', type: 'number' },
        { name: 'status', type: 'text' },
        { name: 'source_url', type: 'url' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_auctions_external_id ON auctions (external_id)',
      ],
    })

    app.save(collection)
  },
)
