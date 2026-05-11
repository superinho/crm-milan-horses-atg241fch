migrate(
  (app) => {
    // 1. Admin User
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'melanasvaz@gmail.com')
    } catch (_) {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      const record = new Record(users)
      record.setEmail('melanasvaz@gmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin Milan')
      app.save(record)
    }

    // 2. Tags
    const tagsCol = app.findCollectionByNameOrId('tags')
    const tagList = [
      { name: 'VIP', color: '#FFD700' },
      { name: 'New Lead', color: '#00FF00' },
      { name: 'Follow-up', color: '#0000FF' },
    ]

    for (const t of tagList) {
      try {
        app.findFirstRecordByData('tags', 'name', t.name)
      } catch (_) {
        const record = new Record(tagsCol)
        record.set('name', t.name)
        record.set('color', t.color)
        app.save(record)
      }
    }

    // 3. Campaigns
    const campaignsCol = app.findCollectionByNameOrId('campaigns')
    try {
      app.findFirstRecordByData('campaigns', 'title', 'Campanha de Verão 2026')
    } catch (_) {
      const record = new Record(campaignsCol)
      record.set('title', 'Campanha de Verão 2026')
      record.set('status', 'active')
      record.set(
        'description',
        'Campanha focada em roupas de banho e acessórios de praia com desconto progressivo.',
      )
      app.save(record)
    }
  },
  (app) => {
    // Revert logic
  },
)
