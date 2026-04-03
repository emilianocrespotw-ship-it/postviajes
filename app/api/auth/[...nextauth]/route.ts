import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

// ESTO ES LO QUE HABILITA LA PUERTA:
expo