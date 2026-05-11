migrate(
  (app) => {
    const tags = new Collection({
      name: 'tags',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'color', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(tags)

    const contacts = new Collection({
      name: 'contacts',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        {
          name: 'tags',
          type: 'relation',
          collectionId: tags.id,
          maxSelect: 999,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_contacts_email ON contacts (email) WHERE email != ''",
      ],
    })
    app.save(contacts)

    const campaigns = new Collection({
      name: 'campaigns',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['draft', 'active', 'paused', 'completed'],
          maxSelect: 1,
        },
        { name: 'description', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_campaigns_status ON campaigns (status)',
        'CREATE INDEX idx_campaigns_created ON campaigns (created)',
      ],
    })
    app.save(campaigns)

    const schedules = new Collection({
      name: 'campaign_schedules',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'campaign',
          type: 'relation',
          collectionId: campaigns.id,
          maxSelect: 1,
        },
        { name: 'scheduled_date', type: 'date' },
        { name: 'status', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(schedules)

    const deals = new Collection({
      name: 'deals',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'value', type: 'number' },
        {
          name: 'stage',
          type: 'select',
          values: [
            'lead',
            'qualified',
            'proposal',
            'negotiation',
            'closed_won',
            'closed_lost',
          ],
          maxSelect: 1,
        },
        {
          name: 'contact',
          type: 'relation',
          collectionId: contacts.id,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_deals_stage ON deals (stage)',
        'CREATE INDEX idx_deals_created ON deals (created)',
      ],
    })
    app.save(deals)

    const tasks = new Collection({
      name: 'tasks',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'due_date', type: 'date' },
        { name: 'completed', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(tasks)

    const auctions = new Collection({
      name: 'auctions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'external_id', type: 'text', required: true },
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
    app.save(auctions)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('auctions'))
    app.delete(app.findCollectionByNameOrId('tasks'))
    app.delete(app.findCollectionByNameOrId('deals'))
    app.delete(app.findCollectionByNameOrId('campaign_schedules'))
    app.delete(app.findCollectionByNameOrId('campaigns'))
    app.delete(app.findCollectionByNameOrId('contacts'))
    app.delete(app.findCollectionByNameOrId('tags'))
  },
)
