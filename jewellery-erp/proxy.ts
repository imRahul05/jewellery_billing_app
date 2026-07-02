import { auth } from "@/lib/auth/server";

export default auth.middleware({ loginUrl: "/login" });


export const config = {
  matcher: [
    "/dashboard/:path*",
    "/billing/:path*",
    "/inventory/:path*",
    "/customers/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
