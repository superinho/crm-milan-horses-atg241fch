migrate(
  (app) => {
    // Ensure user
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'melanasvaz@gmail.com')
    } catch (_) {
      const record = new Record(users)
      record.setEmail('melanasvaz@gmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin')
      app.save(record)
    }

    // Seed Tags
    const tagsCol = app.findCollectionByNameOrId('tags')
    const tagData = [
      { name: 'Arrematante', color: '#3b82f6' },
      { name: 'Vendedor', color: '#ef4444' },
      { name: 'Investidor', color: '#10b981' },
    ]

    const tagIds = []
    for (const t of tagData) {
      let r
      try {
        r = app.findFirstRecordByData('tags', 'name', t.name)
      } catch (_) {
        r = new Record(tagsCol)
        r.set('name', t.name)
        r.set('color', t.color)
        app.save(r)
      }
      tagIds.push(r.id)
    }

    // Seed Contacts
    const contactsCol = app.findCollectionByNameOrId('contacts')
    const contactData = [
      {
        name: 'João Silva',
        email: 'joao.silva@example.com',
        phone: '(11) 99999-1111',
        tags: [tagIds[0]],
      },
      {
        name: 'Maria Souza',
        email: 'maria.souza@example.com',
        phone: '(11) 99999-2222',
        tags: [tagIds[1]],
      },
      {
        name: 'Carlos Ferreira',
        email: 'carlos.ferreira@example.com',
        phone: '(11) 99999-3333',
        tags: [tagIds[2]],
      },
    ]

    for (const c of contactData) {
      try {
        app.findFirstRecordByData('contacts', 'email', c.email)
      } catch (_) {
        const r = new Record(contactsCol)
        r.set('name', c.name)
        r.set('email', c.email)
        r.set('phone', c.phone)
        r.set('tags', c.tags)
        app.save(r)
      }
    }
  },
  (app) => {
    // Keep empty for seed down
  },
)
