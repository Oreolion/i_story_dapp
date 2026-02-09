# Workflows & Prompt Templates

## Prompt Templates

Reusable prompts for common workflows. Copy, fill in the `[placeholder]`, and paste.

### Multi-Part Implementation with Checkpoints
```
I need to fix [describe multi-part issue]. Create a comprehensive implementation
plan where EACH task includes: 1) The specific code change, 2) A verification
command or test I can run to confirm it works, 3) Rollback instructions if it fails.
Use TodoWrite to track progress. Then execute the plan autonomously—after each task,
run its verification before moving to the next. If verification fails, fix it before
proceeding. Commit working changes incrementally so progress isn't lost if we hit limits.
```

### Autonomous Auth Debugging with Browser Testing
```
Debug the auth state sync issue between Google OAuth and wallet connection. Work
autonomously using this approach: 1) Use Playwright to navigate to the app and
attempt the OAuth flow while monitoring network requests, 2) Read the auth-related
source files to understand the state management, 3) Identify where race conditions
could occur, 4) Implement a fix, 5) Use Playwright again to verify the fix works
end-to-end. Document each browser test result. Don't stop to confirm with me—complete
the full investigation and fix cycle.
```

### Autonomous Test Fixing
```
I have failing tests related to [describe issue]. Your goal is to make all tests
pass autonomously. Run the test suite, analyze failures, implement fixes, and iterate
until green. Use this workflow: 1) Run `npm test` to see current failures, 2) Read
relevant source files, 3) Implement a fix, 4) Run tests again, 5) Repeat until all
pass. Don't stop to ask me questions—make your best judgment and keep iterating.
If you hit a dead end after 3 attempts on the same issue, document what you tried
and move on.
```

### Database Constraint Fix
```
Fix this database error. Before implementing, list ALL unique constraints on the
affected table(s) and ensure the fix handles conflicts on each one, not just the
primary key.
```

### Security Review Before Implementation
```
Before implementing this fix, do a quick security review: What auth tokens/sessions
are involved? What could go wrong if this races with another auth flow? Any concerns
I should know about before you start coding?
```

### Phased Task Breakdown
```
I need to fix [X]. Before starting, break this into 2-3 phases where each phase
ends with something testable. We'll verify each phase works before moving to the next.
```

## Headless Mode Commands

Run focused tasks non-interactively to avoid session interruptions.

### Quick Commands
```bash
# Run tests and report failures
claude -p "run vitest and report any failures" --allowedTools "Bash,Read" --max-turns 5

# Fix lint errors
claude -p "fix eslint errors in app/api/" --allowedTools "Bash,Read,Edit" --max-turns 10

# Check migration status
claude -p "List all Supabase migrations and verify story_metadata table exists" \
  --allowedTools "Bash,Read,mcp__supabase__list_migrations,mcp__supabase__execute_sql" \
  --max-turns 5

# Quick security review
claude -p "Review app/api/auth/ for security vulnerabilities" --allowedTools "Read,Grep" --max-turns 5
```

### Database Operations
```bash
# Run migrations and verify
claude -p "run database migrations and verify with a test query" \
  --allowedTools "Bash,Read,mcp__supabase__list_migrations,mcp__supabase__execute_sql" \
  --max-turns 10

# Check constraints before fix
claude -p "List ALL unique constraints on the users table" \
  --allowedTools "mcp__supabase__execute_sql,Read" --max-turns 3
```

### Flags Reference
| Flag | Purpose |
|------|---------|
| `-p "..."` | The prompt/task to execute |
| `--allowedTools` | Restricts which tools Claude can use |
| `--max-turns` | Limits API round-trips (prevents runaway sessions) |
| `--dangerously-skip-permissions` | Run without permission prompts (use with caution) |

## Advanced Autonomous Workflows

### Autonomous Test-Driven Bug Resolution
```
I have failing tests related to [describe issue]. Your goal is to make all tests
pass autonomously. Run the test suite, analyze failures, implement fixes, and iterate
until green. Use this workflow:
1) Run `npx vitest run` to see current failures
2) Read relevant source files
3) Implement a fix
4) Run tests again
5) Repeat until all pass

Don't stop to ask me questions—make your best judgment and keep iterating.
If you hit a dead end after 3 attempts on the same issue, document what you tried
and move on. Commit working changes incrementally so progress isn't lost.
```

### Parallel Investigation with Browser Verification
```
Debug [describe issue]. Work autonomously using this approach:
1) Use Playwright to navigate to the app and attempt the flow while monitoring
   network requests
2) Read the related source files to understand the state management
3) Identify where issues could occur
4) Implement a fix
5) Use Playwright again to verify the fix works end-to-end

Document each browser test result. Don't stop to confirm with me—complete the
full investigation and fix cycle.
```

### Comprehensive Fix Plan with Verification
```
I need to fix [describe multi-part issue]. Create a comprehensive implementation
plan where EACH task includes:
1) The specific code change
2) A verification command or test I can run to confirm it works
3) Rollback instructions if it fails

Use TodoWrite to track progress. Then execute the plan autonomously—after each
task, run its verification before moving to the next. If verification fails, fix
it before proceeding. Commit working changes incrementally so progress isn't lost
if we hit limits.
```
