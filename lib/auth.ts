import { NextAuthOptions } from "next-auth"
import FacebookProvider from "next-auth/providers/facebook"

export const authOptions: NextAuthOptions = {
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      authorization: {
        params: {
          // Solo los scopes básicos que no requieren aprobación especial de Meta.
          // pages_manage_posts + pages_show_list funcionan en modo desarrollo
          // para cuentas admin de la app sin necesitar review.
          // Instagram publish por API requiere producto aprobado → lo manejamos
          // manualmente con el botón que descarga + abre Instagram.
          scope: [
            'public_profile',
            'email',
            'pages_show_list',
            'pages_manage_posts',
          ].join(','),
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
