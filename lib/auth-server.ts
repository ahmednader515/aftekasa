import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** One session lookup per request (layout + page share the same result). */
export const getSession = cache(() => getServerSession(authOptions));
