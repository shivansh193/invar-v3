import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
// import { PrismaAdapter } from '@auth/prisma-adapter'
// import { prisma } from '@/lib/prisma'
// import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // In production:
        // const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        // if (!user || !user.passwordHash) return null
        // const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        // if (!valid) return null
        // return { id: user.id, email: user.email, name: user.name, plan: user.plan }

        // Dev mock
        if (credentials.email === 'demo@invariant.sh' && credentials.password === 'demo') {
          return { id: 'user_1', email: 'demo@invariant.sh', name: 'Demo User' }
        }
        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // token.plan = (user as any).plan ?? 'free'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        // (session.user as any).plan = token.plan
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }