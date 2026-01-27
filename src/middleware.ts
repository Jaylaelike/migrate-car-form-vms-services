import { auth } from "@/auth"
import { getApiPath } from "@/lib/utils"

export default auth((req) => {
    if (!req.auth && req.nextUrl.pathname !== getApiPath("/login")) {
        const newUrl = new URL(getApiPath("/login"), req.nextUrl.origin)
        return Response.redirect(newUrl)
    }
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
}
