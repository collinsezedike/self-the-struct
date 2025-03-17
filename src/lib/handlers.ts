import { Context } from "grammy";
import { HumanMessage } from "@langchain/core/messages";

import { getOrCreateUserKeyPair, initializeAgent } from "./utils";

export async function handleWelcomeResponse(ctx: Context) {
	ctx.reply(
		`Hello there! Great to have you here today.

I will be your financial tour guide and chat buddy. With your experience and my wit, we could make you unholy sums of money. I am here to talk finance so please keep our conversation around that context. In the course of our discuss, I will provide you with trade options where you can choose to buy, sell or ignore. You decisions affect your cash balance and your cash balance affects the longevity of our relationship.
		
I only roll with top-class people. Hence, if you lose all of your money, our business is done and we shall part ways immediately. I do not wish for such to happen so I beg you to guard your assets with wisdom and critical thinking.
		
No pressure, though. You've got this.`
	);
}

export async function handleMessageResponse(ctx: Context) {
	// STEP 1: Fetch the userID from the Context
	const userId = ctx.from?.id.toString();
	if (!userId) return;

	// STEP 2:  Get or Create the Keypair data
	const keyPair = await getOrCreateUserKeyPair(userId);

	// STEP 3: Initialize the agent
	const { agent, config } = await initializeAgent(userId, keyPair);
	const stream = await agent.stream(
		{ messages: [new HumanMessage(ctx.message!.text!)] },
		config
	);

	// STEP 4: Set a timeout
	const timeoutPromise = new Promise((_, reject) =>
		setTimeout(() => reject(new Error("Timeout")), 20000)
	);

	// STEP 5: Reply to the user's message
	try {
		for await (const chunk of (await Promise.race([
			stream,
			timeoutPromise,
		])) as AsyncIterable<{ agent?: any; tools?: any }>) {
			if ("agent" in chunk) {
				if (chunk.agent.messages[0].content)
					await ctx.reply(String(chunk.agent.messages[0].content));
			}
		}
	} catch (error: any) {
		if (error.message === "Timeout") {
			await ctx.reply(
				"I'm sorry, the operation took too long and timed out. Please try again."
			);
		} else {
			console.error("Error processing stream:", error);
			await ctx.reply(
				"I'm sorry, an error occurred while processing your request."
			);
		}
	}
}
