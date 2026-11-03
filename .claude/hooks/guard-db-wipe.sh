#!/bin/sh
# PreToolUse guard: commands that wipe the local Supabase database (accounts, bookings,
# uploads) need the user's explicit OK. New migrations go in with `bun run db:migrate`.
cmd=$(jq -r '.tool_input.command // ""')
if printf '%s' "$cmd" | grep -Eq 'db:reset|db[[:space:]]+reset|--no-backup|volume[[:space:]]+(rm|prune)|system[[:space:]]+prune'; then
  jq -n '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "ask",
    permissionDecisionReason: "This wipes the local Supabase database (admin accounts, bookings, uploads). Apply new migrations with `bun run db:migrate` instead; reset only if the user explicitly asks."}}'
fi
exit 0
