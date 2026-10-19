import { createPrivacyRequestHandlers } from "./handlers";

const handlers = createPrivacyRequestHandlers();
export async function GET(request: Request) { return handlers.GET(request); }
export async function POST(request: Request) { return handlers.POST(request); }
