import { NextAuthOptions } from "next-auth"
import FacebookProvider from "next-auth/providers/facebook"

export const authOptions: NextAuthOptions = {
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      authorization: {
        params: {
          scope: [
            'public_profile',
            'email',
            // Páginas de empresa
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_posts',
            // Instagram Business vinculado a la página
            'instagram_basic',
            'instagram_content_publish',
            // Perfil personal (para publicar en tu propio timeline en dev mode)
            'user_photos',
          ].join(','),
          // Forzar re-consent siempre para que Facebook muestre los checkboxes
          // de permisos correctamente aunque el usuario ya esté logueado
          auth_type: 'rerequest',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.userId = account.providerAccountId
      }
      return token
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken
      session.userId = token.userId
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
