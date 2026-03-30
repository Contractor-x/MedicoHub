/**
 * Generates a study response from the medical tutor AI.
 * Now switched to use Groq (Llama 3 70B) for ultra-fast, high-quality medical inference.
 */
export const generateStudyResponse = async (
  prompt: string,
  context: string
): Promise<string> => {
  // Check for API Key (Vite env variable)
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    console.warn("Medical AI: No Groq API Key found. Using simulation mode.");
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple mock responses based on keywords
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('summar') || lowerPrompt.includes('high-yield')) {
      return "### High-Yield Summary\n\nHere are the key takeaways from this resource:\n\n*   **Core Concept**: The primary mechanism involves [Key Mechanism] which is critical for understanding clinical presentation.\n*   **Pathology**: Dysfunction leads to [Condition], characterized by [Symptom 1] and [Symptom 2].\n*   **Clinical Pearl**: Always remember to check for [Sign] as it is pathognomonic.\n\nIs there a specific part you'd like me to elaborate on?";
    } else if (lowerPrompt.includes('quiz') || lowerPrompt.includes('question')) {
      return "### Quick Quiz\n\n**Q1:** What is the most common cause of the condition described?\n\n*   A) Factor A\n*   B) Factor B\n*   C) Factor C\n\n**Q2:** Which diagnostic test is the gold standard?\n\n*   A) MRI\n*   B) CT Scan\n*   C) Biopsy";
    } else if (lowerPrompt.includes('time') || lowerPrompt.includes('stamp')) {
      return "### Key Timestamps (Estimated)\n\n*   **02:15** - Introduction and basic anatomy\n*   **08:30** - Discussion of pathophysiology\n*   **14:45** - Clinical presentation and diagnosis\n*   **22:10** - Treatment algorithms and management";
    } else {
      return `That's a great question! Based on **${context.split('RESOURCE_OPEN: ')[1]?.split('\n')[0] || 'this resource'}**, here is what you need to know:\n\nThe concept implies that [Explanation]. This is particularly relevant because of [Reason].\n\n### Clinical Relevance\nWhen you see a patient with these symptoms, consider [Differential Diagnosis].\n\nWould you like me to simplify this further?`;
    }
  }

  try {
    const systemInstruction = `You are a friendly, encouraging, and world-class medical research assistant for Medico Hub. 
    Your goal is to act like a personal mentor (similar to NotebookLM) for a medical student.
    
    Context about the user and the resource: ${context}.
    
    CORE RULES:
    1. Be CONVERSATIONAL. Use phrases like "Great question!", "Let's dive into...", or "Think of it this way...".
    2. Be CONCISE but HIGH-YIELD. Focus on clinical pearls.
    3. FORMATTING: Use clear Markdown. Use bolding for key medical terms. Use bullet points for lists. 
    4. ACCURACY: Provide specific mechanisms and references relevant to the open resource.
    5. No weird symbols: Ensure you don't use decorative symbols that might not render. Use standard Markdown (# for headers, ** for bold, - for lists).
    6. Tone: Professional yet approachable, like a senior resident helping a junior student.`;

    // Call Groq API (OpenAI Compatible)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || response.statusText);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I couldn't generate a response at this time.";

  } catch (error: any) {
    console.error("Groq API Error:", error);
    // Return simplified error message
    return `AI Error: ${error.message || "Connection failed"}`;
  }
};
