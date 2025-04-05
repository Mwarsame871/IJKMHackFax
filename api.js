// api.js

// Function to detect dog whistles using OpenAI API
async function getDogWhistlesFromText(text) {
    const OPENAI_API_KEY = 'YOUR_API_KEY'; // Replace with your actual API key
    
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert in identifying coded or racist dog whistle language. From the given text, return a list of any dog whistle phrases, each with the phrase, severity (1 to 3), and a brief explanation of why it\'s considered a dog whistle.'
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        // Extract the content from the API response
        const content = data.choices[0].message.content;
        
        try {
            // Try to parse the response as JSON
            return JSON.parse(content);
        } catch (e) {
            // If parsing fails, return an empty array
            console.error('Failed to parse API response:', e);
            return [];
        }
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        return [];
    }
}

// Export the function for use in other files
export { getDogWhistlesFromText }; 