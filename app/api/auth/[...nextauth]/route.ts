import NextAuth from "next-auth"
import FacebookProvider from "next-auth/providers/facebook"

const handler = NextAuth({
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      // Pedimos permisos para ver las páginas y publicar
      authorization: {
        params: {
          scope: 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Guardamos el token de Facebook para usarlo después para publicar
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }