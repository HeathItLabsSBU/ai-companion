// Replace the entire file content with Supabase
import { supabase } from './supabase-client'

// Create a compatibility layer to minimize code changes
export const prismadb = {
  companion: {
    async findMany(options: any = {}) {
      let query = supabase.from('companions').select(`
        *,
        category:categories(*),
        _count:messages(count)
      `)
      
      if (options.where?.categoryId) {
        query = query.eq('category_id', options.where.categoryId)
      }
      
      if (options.where?.name?.search) {
        query = query.ilike('name', `%${options.where.name.search}%`)
      }
      
      if (options.orderBy?.createdAt) {
        query = query.order('created_at', { ascending: options.orderBy.createdAt === 'asc' })
      }
      
      const { data, error } = await query
      if (error) throw error
      
      // Transform to match Prisma format
      return data?.map(companion => ({
        ...companion,
        categoryId: companion.category_id,
        userId: companion.user_id,
        userName: companion.user_name,
        createdAt: companion.created_at,
        updatedAt: companion.updated_at,
        _count: { messages: companion._count || 0 }
      })) || []
    },

    async findUnique(options: any) {
      let query = supabase.from('companions').select(`
        *,
        category:categories(*),
        messages(*),
        _count:messages(count)
      `)
      
      if (options.where.id) {
        query = query.eq('id', options.where.id)
      }
      
      if (options.where.userId) {
        query = query.eq('user_id', options.where.userId)
      }
      
      const { data, error } = await query.single()
      if (error && error.code !== 'PGRST116') throw error
      
      if (!data) return null
      
      // Transform to match Prisma format
      return {
        ...data,
        categoryId: data.category_id,
        userId: data.user_id,
        userName: data.user_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        messages: data.messages?.map((msg: any) => ({
          ...msg,
          companionId: msg.companion_id,
          userId: msg.user_id,
          createdAt: msg.created_at,
          updatedAt: msg.updated_at
        })) || [],
        _count: { messages: data._count || 0 }
      }
    },

    async create(options: any) {
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
      
      if (error) throw error
      
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
      
      if (error) throw error
      
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