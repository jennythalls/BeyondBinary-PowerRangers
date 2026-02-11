const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const cache: Record<string, Record<string, string>> = {};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category } = await req.json();
    if (!category) {
      return new Response(
        JSON.stringify({ error: "Category is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `${today}_${category}`;

    if (cache[cacheKey]) {
      return new Response(JSON.stringify(cache[cacheKey]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompts: Record<string, string> = {
      stressed:
        "Generate exactly ONE thoughtful, calming reflection question that helps someone who is feeling stressed. The question should encourage self-awareness and stress relief. Be warm and empathetic. Return ONLY a JSON object with a single key 'question' containing the question string. No markdown.",
      burnout:
        "Generate exactly ONE thoughtful reflection question that helps someone experiencing study or work burnout. The question should encourage rest, perspective, and recovery. Be warm and supportive. Return ONLY a JSON object with a single key 'question' containing the question string. No markdown.",
      sleep:
        "Generate exactly ONE calming reflection question that helps someone struggling with sleep issues. The question should encourage relaxation and peaceful thoughts. Be gentle and soothing. Return ONLY a JSON object with a single key 'question' containing the question string. No markdown.",
    };

    const prompt = prompts[category] || prompts.stressed;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: `Generate a unique reflection question for ${today}. Use seed: ${today}-${category}` },
          ],
          temperature: 1,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("AI gateway error:", err);
      return new Response(
        JSON.stringify({ error: "Failed to generate question" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    const parsed = JSON.parse(content);
    cache[cacheKey] = parsed;

    // Clean old entries
    for (const key of Object.keys(cache)) {
      if (!key.startsWith(today)) delete cache[key];
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
