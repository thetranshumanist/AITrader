import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const { GET, POST } = toNextJsHandler(auth);