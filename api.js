// api.js

// Function to detect dog whistles using OpenAI API
async function getDogWhistlesFromText(text) {
    const OPENAI_API_KEY = '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';
    
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
                        content: `You are an expert in identifying coded or racist dog whistle language. Analyze the given text and identify any potential dog whistle phrases.
                        For each phrase found, provide:
                        1) The exact phrase (keep it short and specific)
                        2) A severity rating (1=mild, 2=moderate, 3=severe)
                        3) A brief explanation 2-3 sentences
                        Format your response as a valid JSON array like this:
                        [{"phrase": "example", "severity": 2, "reason": "brief reason"}]
                        . If no dog whistles found, return []`
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        // Extract and clean the content from the API response
        let content = data.choices[0].message.content.trim();
        
        // Log the raw content for debugging
        console.log('[DWD] Raw API response:', content);

        try {
            // First try direct parsing
            return JSON.parse(content);
        } catch (e) {
            console.log('[DWD] Initial parse failed, attempting to fix JSON');
            
            // Try to extract just the JSON array part
            const match = content.match(/\[.*\]/s);
            if (match) {
                content = match[0];
            }

            // Remove any trailing commas in arrays
            content = content.replace(/,\s*]/g, ']');
            
            // Remove any trailing commas in objects
            content = content.replace(/,\s*}/g, '}');
            
            // Fix any double quotes within strings
            content = content.replace(/(?<!\\)\\"/g, '"');
            content = content.replace(/(?<!\\)"/g, '\\"');
            content = content.replace(/\\\\"/g, '\\"');
            
            // Try to parse the fixed content
            try {
                const parsed = JSON.parse(content);
                
                // Validate and clean the response
                if (Array.isArray(parsed)) {
                    return parsed.filter(item => (
                        item &&
                        typeof item === 'object' &&
                        typeof item.phrase === 'string' &&
                        typeof item.severity === 'number' &&
                        typeof item.reason === 'string'
                    )).map(item => ({
                        phrase: item.phrase.trim().substring(0, 100),
                        severity: Math.max(1, Math.min(3, Math.round(item.severity))),
                        reason: item.reason.trim().substring(0, 50)
                    }));
                }
            } catch (e2) {
                console.error('[DWD] Failed to fix JSON:', e2);
                console.log('[DWD] Problematic content:', content);
            }
            
            // If all parsing attempts fail, return empty array
            return [];
        }
    } catch (error) {
        console.error('[DWD] Error calling OpenAI API:', error);
        return [];
    }
}

// Make function globally available
window.getDogWhistlesFromText = getDogWhistlesFromText; 