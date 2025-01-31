import { Router } from "express";
import { supabase } from "../config/supabase";

const router = Router();

// Example route to fetch data from Supabase
router.get("/data", async (req, res) => {
  try {
    // Replace 'your_table' with an actual table name from your Supabase database
    const { data, error } = await supabase
      .from("your_table")
      .select("*")
      .limit(10);

    if (error) {
      throw error;
    }

    res.json({ data });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
