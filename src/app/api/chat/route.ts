import { NextRequest, NextResponse } from "next/server";
import { Bot, GrammyError, HttpError, webhookCallback } from "grammy";

import { TELEGRAM_BOT_TOKEN } from "@/lib/utils";
import { handleMessageResponse, handleWelcomeResponse } from "@/lib/handlers";

const bot = new Bot(TELEGRAM_BOT_TOKEN);

export async function POST(req: NextRequest) {
	try {
		bot.command("start", handleWelcomeResponse);
		bot.on("message:text", handleMessageResponse);

		// For webhook
		// await bot.api.setWebhook(req.url);
		// const handler = webhookCallback(bot, "std/http");
		// return handler(req);

		// For long polling
		bot.catch((err) => {
			const ctx = err.ctx;
			console.error(
				`Error while handling update ${ctx.update.update_id}:`
			);
			const e = err.error;
			if (e instanceof GrammyError) {
				console.error("Error in request:", e.description);
			} else if (e instanceof HttpError) {
				console.error("Could not contact Telegram:", e);
			} else {
				console.error("Unknown error:", e);
			}
			ctx.reply("An error occured. Please try that again!");
		});
		bot.start();
		return NextResponse.json("Bot is up and running!");
	} catch (error: any) {
		return NextResponse.json(
			{ error: error.message ? error.message : error },
			{ status: 500 }
		);
	}
}
