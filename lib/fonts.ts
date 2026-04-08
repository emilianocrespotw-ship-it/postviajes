import { Playfair_Display, Unbounded } from 'next/font/google'

export const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-playfair',
})

export const unbounded = Unbounded({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-unbounded',
})
