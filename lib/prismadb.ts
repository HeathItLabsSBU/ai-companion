import { supabase } from './supabase-client'

// Create a compatibility layer to minimize code changes
export const prismadb = {
  companion: {
    async findMany(options: any = {}) {
      let query = supabase.from('companions').select(`
        *,
        categories!inner(*)
      `)
      
      if (options.where?.categoryId) {
        query = query.eq('category_id', options.where.categoryId)
      }
      
      if (options.where?.name?.search) {
        query = query.ilike('name', `%${options.where.name.search}%`)
      }
      
      if (options.orderBy?.createdAt) {
        query = query.order('created_at', { ascending: options.orderBy.createdAt === 'asc' })
      } else {
        query = query.order('created_at', { ascending: false })
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error("Supabase findMany error:", error)
        throw error
      }
      
      console.log("Raw Supabase data:", data) // Debug log
      
      // Get message counts separately
      const companionsWithCounts = await Promise.all(
        (data || []).map(async (companion) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('companion_id', companion.id)
          
          return {
            ...companion,
            categoryId: companion.category_id,
            userId: companion.user_id,
            userName: companion.user_name,
            createdAt: companion.created_at,
            updatedAt: companion.updated_at,
            category: companion.categories,
            _count: { messages: count || 0 }
          }
        })
      )
      
      console.log("Transformed companions:", companionsWithCounts) // Debug log
      return companionsWithCounts
    },

    async findUnique(options: any) {
      let query = supabase.from('companions').select(`
        *,
        categories(*),
        messages(*)
      `)
      
      if (options.where.id) {
        query = query.eq('id', options.where.id)
      }
      
      if (options.where.userId) {
        query = query.eq('user_id', options.where.userId)
      }
      
      const { data, error } = await query.single()
      if (error && error.code !== 'PGRST116') {
        console.error("Supabase findUnique error:", error)
        throw error
      }
      
      if (!data) return null
      
      // Transform to match Prisma format
      return {
        ...data,
        categoryId: data.category_id,
        userId: data.user_id,
        userName: data.user_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        category: data.categories,
        messages: data.messages?.map((msg: any) => ({
          ...msg,
          companionId: msg.companion_id,
          userId: msg.user_id,
          createdAt: msg.created_at,
          updatedAt: msg.updated_at
        })) || [],
        _count: { messages: data.messages?.length || 0 }
      }
    },

    async create(options: any) {
      console.log("Creating companion with data:", options.data) // Debug log
      
      const { data, error } = await supabase
        .from('companions')
        .insert({
          category_id: options.data.categoryId,
          user_id: options.data.userId,
          user_name: options.data.userName,
          src: options.data.src,
          name: options.data.name,
          description: options.data.description,
          instructions: options.data.instructions,
          seed: options.data.seed
        })
        .select()
        .single()
      
      if (error) {
        console.error("Supabase create error:", error)
        throw error
      }
      
      console.log("Created companion:", data) // Debug log
      
      return {
        ...data,
        categoryId: data.category_id,
        userId: data.user_id,
        userName: data.user_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    },

    async update(options: any) {
      const updateData: any = {}
      
      if (options.data.src) updateData.src = options.data.src
      if (options.data.name) updateData.name = options.data.name
      if (options.data.description) updateData.description = options.data.description
      if (options.data.instructions) updateData.instructions = options.data.instructions
      if (options.data.seed) updateData.seed = options.data.seed
      if (options.data.categoryId) updateData.category_id = options.data.categoryId
      
      // Handle nested message creation
      if (options.data.messages?.create) {
        const message = options.data.messages.create
        await supabase.from('messages').insert({
          content: message.content,
          role: message.role,
          user_id: message.userId,
          companion_id: options.where.id
        })
      }
      
      if (Object.keys(updateData).length > 0) {
        updateData.updated_at = new Date().toISOString()
        
        const { data, error } = await supabase
          .from('companions')
          .update(updateData)
          .eq('id', options.where.id)
          .select()
          .single()
        
        if (error) throw error
        
        return {
          ...data,
          categoryId: data.category_id,
          userId: data.user_id,
          userName: data.user_name,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }
      }
      
      // Just return the existing companion if no updates
      return this.findUnique({ where: { id: options.where.id } })
    },

    async delete(options: any) {
      const { data, error } = await supabase
        .from('companions')
        .delete()
        .eq('id', options.where.id)
        .eq('user_id', options.where.userId)
        .select()
        .single()
      
      if (error) throw error
      
      return {
        ...data,
        categoryId: data.category_id,
        userId: data.user_id,
        userName: data.user_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    }
  },

  category: {
    async findMany() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) {
        console.error("Supabase categories error:", error)
        throw error
      }
      
      return data?.map(cat => ({
        ...cat,
        createdAt: cat.created_at,
        updatedAt: cat.updated_at
      })) || []
    }
  },

  userSubscription: {
    async findUnique(options: any) {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', options.where.userId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      if (!data) return null
      
      return {
        ...data,
        userId: data.user_id,
        stripeCustomerId: data.stripe_customer_id,
        stripeSubscriptionId: data.stripe_subscription_id,
        stripePriceId: data.stripe_price_id,
        stripeCurrentPeriodEnd: data.stripe_current_period_end ? new Date(data.stripe_current_period_end) : null
      }
    }
  }
}

export default prismadb