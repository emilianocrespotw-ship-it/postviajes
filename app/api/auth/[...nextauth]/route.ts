import NextAuth from 'next-auth'
import FacebookProvider from 'next-auth/providers/facebook'

/**
 * NextAuth con Facebook.
 * Pedimos permisos para publicar en páginas e Instagram.
 */
const handler = NextAuth({
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      // Permisos necesarios para publicar en Facebook Pages e Instagram
      authorization: {
        params: {
          scope: [
            'email',
            'public_profile',
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_posts',
            'pages_manage_metadata',
            'instagram_basic',
            'instagram_content_publish',
          ].join(','),
        },
      },
    }),
  ],
  callbacks: {
    // Guardar el access_token en la sesión para usarlo al publicar
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      ;(session as any).accessToken = token.accessToken
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})

export { handler as GET, handler as POST }
