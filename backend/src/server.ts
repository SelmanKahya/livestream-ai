import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import exampleRouter from "./routes/example";
import { supabaseAdmin } from "./config/supabase";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Function to process program inputs with Claude
async function processInputsWithClaude() {
  console.log("🔄 Starting Claude processing...");
  if (!supabaseAdmin) {
    console.error("❌ Supabase not initialized");
    return null;
  }

  try {
    // Fetch all program inputs where iteration_id is null, ensuring one input per profile
    console.log("📥 Fetching program inputs...");
    const { data: inputs, error: fetchError } = await supabaseAdmin
      .from("program_input")
      .select("input_text, profile_id")
      .is("iteration_id", null)
      // Use distinct on profile_id to ensure one input per profile
      // This will take the most recent input for each profile due to default ordering
      .limit(1000);

    if (fetchError) throw fetchError;
    if (!inputs || inputs.length === 0) {
      console.log("ℹ️ No inputs to process");
      return null;
    }

    // Create a Map to store the latest input per profile
    const profileInputs = new Map();
    inputs.forEach((input) => {
      profileInputs.set(input.profile_id, input.input_text);
    });

    console.log(`📊 Processing ${profileInputs.size} unique inputs`);

    // Format unique inputs for Claude
    const inputsText = Array.from(profileInputs.values())
      .map((text, index) => `${index + 1}. ${text.slice(0, 70)}`)
      .join("\n");

    // Get Claude's analysis
    console.log("🤖 Sending request to Claude...");
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: `Here are several program ideas:\n\n${inputsText}\n\nPlease analyze these ideas, identify common patterns and themes, and propose a single comprehensive web application idea that combines the best elements of all inputs. The output should be a detailed concept for an HTML/web application that is innovative and cohesive. Focus on:\n1. Core functionality and features\n2. User interface and experience considerations\n3. Key interactive elements\n4. Data management approach\n5. Potential technical implementation details\n\nEnsure the combined idea is practical to implement as a web application while maintaining the innovative spirit of the original inputs.`,
        },
      ],
    });

    const content = message.content[0];
    console.log(content);
    if (content.type !== "text") {
      throw new Error("Unexpected response format from Claude");
    }

    console.log("✅ Claude processing complete");
    return content.text;
  } catch (error) {
    console.error("❌ Claude processing failed:", error);
    return null;
  }
}

// State management loop
let isFirstTime = true;

async function updateProgramState() {
  console.log("🔄 Updating program state...");
  if (!supabaseAdmin) {
    console.error("❌ Supabase not initialized");
    return;
  }

  try {
    console.log("⏳ Setting INITIAL state...");
    const { error } = await supabaseAdmin
      .from("program_state")
      .update({ state: "INITIAL" })
      .eq("id", 1);

    if (error) throw error;

    console.log("✅ State set to INITIAL");

    // After 5 minutes, process inputs and update to ITERATION state
    setTimeout(async () => {
      console.log("⏰ Timer triggered, processing inputs...");
      if (!supabaseAdmin) {
        console.error("❌ Supabase not initialized");
        return;
      }

      try {
        console.log("🔄 Processing inputs with Claude...");
        const combinedIdea = await processInputsWithClaude();

        if (combinedIdea) {
          console.log("💾 Storing combined idea...");
          // Store the combined idea in program_code
          const { data: newCode, error: insertError } = await supabaseAdmin
            .from("program_code")
            .insert({ code: " " })
            .select()
            .single();

          if (insertError) throw insertError;

          // Get HTML implementation
          console.log("🤖 Generating HTML implementation...");
          const htmlMessage = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 8000,
            messages: [
              {
                role: "user",
                content: `Convert this web application idea into a complete, working HTML implementation. 
                Use only vanilla HTML, CSS, and JavaScript - no external libraries or frameworks. 
                Return ONLY the complete code, nothing else. Here's the idea:\n\n${combinedIdea} - now return html code only.`,
              },
            ],
          });

          const htmlContent = htmlMessage.content[0];
          console.log(htmlMessage.content);
          if (htmlContent.type !== "text") {
            throw new Error("Unexpected response format from Claude");
          }

          // Store the HTML implementation
          console.log("💾 Storing HTML implementation...");
          const { error: htmlInsertError } = await supabaseAdmin
            .from("program_code")
            .update({ code: htmlContent.text })
            .eq("id", newCode.id);

          if (htmlInsertError) throw htmlInsertError;

          // Only update iteration_ids if it's not the first time
          if (!isFirstTime) {
            console.log("📝 Updating input iteration IDs...");
            const { error: updateInputsError } = await supabaseAdmin
              .from("program_input")
              .update({ iteration_id: newCode.id })
              .is("iteration_id", null);

            if (updateInputsError) throw updateInputsError;

            console.log("✅ Inputs updated successfully");
          } else {
            console.log("🆕 First run completed");
            isFirstTime = false;
          }
        }

        console.log("⏳ Setting ITERATION state...");
        await supabaseAdmin
          .from("program_state")
          .update({ state: "ITERATION" })
          .eq("id", 1);

        console.log("✅ State set to ITERATION");
        console.log("🔄 Starting periodic updates...");
        startPeriodicCodeUpdates();
      } catch (error) {
        console.error("❌ INITIAL phase failed:", error);
      }
    }, 10000); // 5 minutes in milliseconds
  } catch (error) {
    console.error("❌ State update failed:", error);
  }
}

// Function to handle periodic code updates
async function startPeriodicCodeUpdates() {
  console.log("⚡ Initializing periodic updates...");
  if (!supabaseAdmin) {
    console.error("❌ Supabase not initialized");
    return;
  }

  const updateInterval = 30000; // 2 minutes in milliseconds

  const periodicUpdate = async () => {
    console.log("🔄 Running periodic update...");
    if (!supabaseAdmin) {
      console.error("❌ Supabase not initialized");
      return;
    }

    try {
      console.log("📝 Creating new iteration...");
      // Insert new row in program_code
      const { data: newCode, error: insertError } = await supabaseAdmin
        .from("program_code")
        .insert({ code: "// New iteration" })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update program_state with new iteration
      const { error: updateError } = await supabaseAdmin
        .from("program_state")
        .update({ current_iteration: newCode.id })
        .eq("id", 1);

      if (updateError) throw updateError;

      console.log(`✅ New iteration created: ${newCode.id}`);
    } catch (error) {
      console.error("❌ Periodic update failed:", error);
    }
  };

  // Start the periodic updates
  setInterval(periodicUpdate, updateInterval);
  // Run first update immediately
  periodicUpdate();
}

updateProgramState();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to the Express TypeScript API with Supabase integration",
  });
});

// Mount example routes
app.use("/api/example", exampleRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

// Start server
app.listen(port, () => {
  console.log(`
🚀 Server started
📍 Port: ${port}
🌐 URL: http://localhost:${port}
  `);
});
