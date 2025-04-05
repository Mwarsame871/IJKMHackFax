// api.js

// Get API key from secrets.js or use placeholder
const OPENAI_API_KEY = window.OPENAI_API_KEY || 'YOUR_API_KEY_HERE';

// Function to check if API key is valid
function isValidApiKey(key) {
    return key && key !== 'YOUR_API_KEY_HERE' && key.startsWith('sk-');
}

// Function to get dog whistles from text
window.getDogWhistlesFromText = async function(text) {
    if (!isValidApiKey(OPENAI_API_KEY)) {
        throw new Error('Please set up your OpenAI API key in secrets.js');
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a detector of racially coded language (dog whistles). Analyze the given text and return an array of objects containing detected phrases, their severity (1-3), and explanations. Format: [{\"phrase\": \"text\", \"severity\": number, \"reason\": \"explanation\"}]. Severity levels: 1=mild, 2=moderate, 3=severe. Return empty array if none found."
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log("[DWD] Raw API response:", data);

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid API response format');
        }

        const content = data.choices[0].message.content;
        
        try {
            // Try to parse the content as JSON
            return JSON.parse(content);
        } catch (e) {
            console.error("[DWD] Failed to parse API response content:", e);
            // Try to extract JSON array using regex as fallback
            const match = content.match(/\[.*\]/s);
            if (match) {
                return JSON.parse(match[0]);
            }
            throw new Error('Failed to parse API response');
        }
    } catch (error) {
        console.error("[DWD] API call error:", error);
        throw error;
    }
}; 