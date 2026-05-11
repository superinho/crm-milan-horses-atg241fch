import pb from '@/lib/pocketbase/client'

export type Auction = {
  id: string
  external_id: string
  title: string
  value: number
  status: string
  source_url: string
  created: string
  updated: string
}

export const auctionsService = {
  async getAuctions() {
    const items = await pb
      .collection('auctions')
      .getFullList({ sort: '-created' })
    return items as unknown as Auction[]
  },

  async saveAuction(data: Omit<Auction, 'id' | 'created' | 'updated'>) {
    // Upsert behavior based on external_id
    try {
      const existing = await pb
        .collection('auctions')
        .getFirstListItem(`external_id="${data.external_id}"`)
      return await pb.collection('auctions').update(existing.id, data)
    } catch (_) {
      return await pb.collection('auctions').create(data)
    }
  },
}
