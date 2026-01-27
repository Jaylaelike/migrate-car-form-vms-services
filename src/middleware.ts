import { auth } from "@/auth"
import { getApiPath } from "@/lib/utils"

export default auth((req) => {
    const isLoginPage = req.nextUrl.pathname === getApiPath("/login") || req.nextUrl.pathname === "/login";

    if (!req.auth && !isLoginPage) {
        const newUrl = new URL(getApiPath("/login"), req.nextUrl.origin)
        return Response.redirect(newUrl)
    }
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
