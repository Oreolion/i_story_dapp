async function main() {
  console.error("🔍 READ HOOK TRIGGERED");
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const toolArgs = JSON.parse(Buffer.concat(chunks).toString());
  
  console.error("Tool args:", JSON.stringify(toolArgs, null, 2));
  
  // Extract the file path Claude is trying to read
  const readPath =
    toolArgs.tool_input?.file_path || 
    toolArgs.tool_input?.path || 
    toolArgs.path ||
    "";
  
  console.error("Attempting to read:", readPath);
  
  // Check if Claude is trying to read the .env file
  if (readPath.startsWith(".env") && readPath !== ".env.example") {
    console.error("❌ BLOCKED: You cannot read .env files");
    process.exit(2);  // Exit code 2 = blocked
  }
  
  // THIS IS CRITICAL - Allow the operation
  console.error("✅ ALLOWED");
  process.exit(0);  // Exit code 0 = success/allowed
}

main().catch(err => {
  console.error("Hook error:", err);
  process.exit(1);
});