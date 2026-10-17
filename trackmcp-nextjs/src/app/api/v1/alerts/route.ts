import { createAlertsHandlers } from "./handlers.ts";

const handlers = createAlertsHandlers();

export const GET = handlers.GET;
export const POST = handlers.POST;
