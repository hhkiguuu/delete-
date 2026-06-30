import discord
from discord.ext import commands
import asyncio
import random
import os
import re
import time

TOKEN = os.environ.get("MTUxOTc1Mjk0ODQwODY1MjAwOA.GPb4Kr.8AGwHuXoqB7Ck_E6PN6viEVw__so04UgIVHhpw")

# 🔧 Hardcode your fake/troll user ID here, or set it live with !rig
RIGGED_WINNER_ID = 1519064660501074133

intents = discord.Intents.default()
intents.message_content = True
intents.reactions = True
intents.members = True

bot = commands.Bot(command_prefix="/", intents=intents)

active_giveaway = {
    "message_id": None,
    "channel_id": None,
    "title": None,
    "end_time": None,
    "task": None,
}

DURATION_RE = re.compile(r"(\d+)\s*([smhd])", re.IGNORECASE)
UNIT_SECONDS = {"s": 1, "m": 60, "h": 3600, "d": 86400}


def parse_duration(text: str) -> int:
    """Parses things like '30s', '10m', '2h', '1d' into seconds."""
    match = DURATION_RE.fullmatch(text.strip())
    if not match:
        raise ValueError("Bad duration format")
    amount, unit = match.groups()
    return int(amount) * UNIT_SECONDS[unit.lower()]


@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")


@bot.command()
async def giveaway(ctx, duration: str, *, title: str):
    """Start a timed giveaway. Usage: !giveaway <duration> <title>
    Duration examples: 30s, 10m, 2h, 1d
    Example: !giveaway 1h Free Nitro Giveaway
    """
    try:
        seconds = parse_duration(duration)
    except ValueError:
        await ctx.send("⚠️ Bad duration. Use formats like `30s`, `10m`, `2h`, `1d`. Example: `!giveaway 1h Free Nitro`")
        return

    end_time = time.time() + seconds
    end_unix = int(end_time)

    embed = discord.Embed(
        title=f"🎉 {title} 🎉",
        description=(
            f"React with 🎉 to enter!\n"
            f"Ends: <t:{end_unix}:R> (<t:{end_unix}:F>)\n"
            f"i hate u niggers)"
        ),
        color=discord.Color.gold(),
    )
    msg = await ctx.send(embed=embed)
    await msg.add_reaction("🎉")

    active_giveaway["message_id"] = msg.id
    active_giveaway["channel_id"] = msg.channel.id
    active_giveaway["title"] = title
    active_giveaway["end_time"] = end_time

    if active_giveaway["task"]:
        active_giveaway["task"].cancel()
    active_giveaway["task"] = bot.loop.create_task(_auto_end(ctx, seconds))


async def _auto_end(ctx, seconds: float):
    try:
        await asyncio.sleep(seconds)
        await _run_draw(ctx)
    except asyncio.CancelledError:
        pass


@bot.command()
async def rig(ctx, user_id: int):
    """Change the rigged winner ID on the fly. Usage: !rig <user_id>"""
    global RIGGED_WINNER_ID
    RIGGED_WINNER_ID = user_id
    await ctx.send(f"✅ (quietly) winner set to `{user_id}`", delete_after=3)


@bot.command()
async def endgiveaway(ctx):
    """Manually end the giveaway early, skipping the timer."""
    if not active_giveaway["message_id"]:
        await ctx.send("No active giveaway!")
        return
    if active_giveaway["task"]:
        active_giveaway["task"].cancel()
    await _run_draw(ctx)


async def _run_draw(ctx):
    """Shared logic: fake shuffle animation, then reveal the rigged winner."""
    if not active_giveaway["message_id"]:
        return

    channel = bot.get_channel(active_giveaway["channel_id"])
    msg = await channel.fetch_message(active_giveaway["message_id"])

    # Get real entrants (for show)
    reaction = next((r for r in msg.reactions if str(r.emoji) == "🎉"), None)
    entrants = []
    if reaction:
        async for user in reaction.users():
            if not user.bot:
                entrants.append(user)

    suspense = await channel.send("🎲 Picking a winner...")

    # Fake shuffle animation using real entrant names (builds suspense)
    names_pool = [u.display_name for u in entrants] or ["Mystery Entrant"]
    for _ in range(8):
        fake_pick = random.choice(names_pool)
        await suspense.edit(content=f"🎲 Picking a winner... **{fake_pick}**?")
        await asyncio.sleep(0.6)

    # Reveal rigged winner regardless of who actually entered
    await suspense.edit(
        content=f"🎉 **Winner of {active_giveaway['title']}**: <@{RIGGED_WINNER_ID}>\n\nnivger 😭😭"
    )

    active_giveaway["message_id"] = None
    active_giveaway["channel_id"] = None
    active_giveaway["title"] = None
    active_giveaway["end_time"] = None
    active_giveaway["task"] = None


bot.run(TOKEN)
