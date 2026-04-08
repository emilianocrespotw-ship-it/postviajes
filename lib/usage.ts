import { supabaseAdmin } from './supabase'

export const ADMIN_EMAIL = 'emiliano.crespo.tw@gmail.com'
export const FREE_LIMIT = 10

/** Returns the current YYYY-MM string, e.g. "2026-04" */
function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export interface UsageInfo {
  postsThisMonth: number
  plan: 'free' | 'pro'
  limitReached: boolean
  isAdmin: boolean
}

/** Get usage info for a user. Creates the user row if missing. */
export async function getUserUsage(email: string): Promise<UsageInfo> {
  const isAdmin = email === ADMIN_EMAIL

  const { data } = await supabaseAdmin
    .from('users')
    .select('plan, posts_this_month, posts_reset_month')
    .eq('email', email)
    .single()

  if (!data) {
    // User not in DB yet — treat as fresh free user
    return { postsThisMonth: 0, plan: 'free', limitReached: false, isAdmin }
  }

  const plan = (data.plan || 'free') as 'free' | 'pro'
  const month = currentMonth()

  // Reset counter if it's a new month
  let postsThisMonth = data.posts_this_month || 0
  if (data.posts_reset_month !== month) {
    postsThisMonth = 0
    // Reset in DB asynchronously (don't await to keep response fast)
    supabaseAdmin
      .from('users')
      .update({ posts_this_month: 0, posts_reset_month: month })
      .eq('email', email)
  }

  const limitReached = !isAdmin && plan === 'free' && postsThisMonth >= FREE_LIMIT

  return { postsThisMonth, plan, limitReached, isAdmin }
}

/** Increment the post counter after a successful publish. */
export async function incrementPostCount(email: string): Promise<void> {
  const isAdmin = email === ADMIN_EMAIL
  if (isAdmin) return  // admin is never tracked

  const month = currentMonth()

  // Upsert to handle users not yet in DB
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('posts_this_month, posts_reset_month')
    .eq('email', email)
    .single()

  if (!existing) {
    await supabaseAdmin.from('users').upsert({
      email,
      plan: 'free',
      posts_this_month: 1,
      posts_reset_month: month,
    }, { onConflict: 'email' })
    return
  }

  const newCount = existing.posts_reset_month === month
    ? (existing.posts_this_month || 0) + 1
    : 1

  await supabaseAdmin
    .from('users')
    .update({ posts_this_month: newCount, posts_reset_month: month })
    .eq('email', email)
}
