migrate(
  (app) => {
    const collections = [
      'tags',
      'contacts',
      'campaigns',
      'campaign_schedules',
      'deals',
      'tasks',
      'auctions',
    ]

    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        col.listRule = ''
        col.viewRule = ''
        col.createRule = ''
        col.updateRule = ''
        col.deleteRule = ''
        app.save(col)
      } catch (_) {}
    }
  },
  (app) => {
    const collections = [
      'tags',
      'contacts',
      'campaigns',
      'campaign_schedules',
      'deals',
      'tasks',
      'auctions',
    ]

    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        col.listRule = "@request.auth.id != ''"
        col.viewRule = "@request.auth.id != ''"
        col.createRule = "@request.auth.id != ''"
        col.updateRule = "@request.auth.id != ''"
        col.deleteRule = "@request.auth.id != ''"
        app.save(col)
      } catch (_) {}
    }
  },
)
