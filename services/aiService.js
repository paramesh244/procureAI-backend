const { GoogleGenAI } = require("@google/genai");


const ai = new GoogleGenAI({
    apiKey : process.env.GEMINI_API_KEY
});



  function parseAIJson(text) {
    try {
      return JSON.parse(text);
    } catch (err) {
      // try to extract first JSON object from text
      const match = text.match(/\{[\s\S]*\}/);
    //   console.log(match)
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (err2) {
          throw new Error('Found JSON-like substring but failed to parse: ' + err2.message);
        }
      }
      throw new Error('Response is not valid JSON');
    }
  }

async function toRFP(text) {

//     const prompt = `You are an assistant that converts procurement requirements into a strict JSON structure.
//     Input: ${text}

// Output JSON schema:
// {
//   "title": string,
//   "description": string,
//   "budget": number, // total budget or null
//   "delivery_timeline": string,
//   "items": [{ "name": string, "quantity": number, "specifications": string }],
//   "payment_terms": string,
//   "warranty": string
// }
// Return only valid JSON.
//   `;
const prompt = `
You are an assistant that converts natural-language procurement requirements into a strict JSON structure.

If the input does NOT clearly describe a procurement request (for example: random text, greetings, jokes, incomplete information, or irrelevant content), then return:

{
  "error": true,
  "message": "Invalid procurement input. Please provide clear purchase or requirement details."
}

Otherwise, analyze the input and return ONLY valid JSON matching the schema below:

{
  "title": string,
  "description": string,
  "budget": number | null, 
  "delivery_timeline": string | null,
  "items": [
    { "name": string, "quantity": number | null, "specifications": string | null }
  ],
  "payment_terms": string | null,
  "warranty": string | null
}

Rules:
- Return strictly JSON. No extra text.
- All fields must exist. If unknown or not provided, set them to null or empty arrays.
- Do not hallucinate unrealistic values.
- Do not include comments or explanations.
- If invalid input → return the error JSON format above.

Input:
${text}
`;


   const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    // model: "gemini-3-pro-preview",
    contents: prompt,
  })



  try {
    return parseAIJson(response.text);

  } catch (err) {
    console.error('Failed to parse AI response as JSON:', err.message);
    console.log('Raw response:', response.text);
  }

}

//Parse vendor response (email body / attachments) into proposal fields

async function parseVendorResponse(rawText){
  
    const prompt = `
Extract total price,items with each price, delivery timeline, warranty, payment_terms and any special terms from this vendor response.
Return strictly JSON with keys: price (number or null),"items": [{ "name": string, "quantity": number, "price": Number (each)}], delivery (string), warranty (string), payment_terms (string), notes (string).
Response: ${rawText}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  })

  try {
    return parseAIJson(response.text);
    
  } catch (err) {
    console.error('Failed to parse AI response as JSON:', err.message);
    console.log('Raw response:', response.text);
  }
}



//Compare proposals and recommend vendor

async function compareProposals(rfp, proposals){
  const prompt = `
You are an assistant that compares proposals against an RFP.

Input:
RFP (JSON): ${JSON.stringify(rfp)}
Proposals (JSON array): ${JSON.stringify(proposals)}

Output REQUIREMENTS:
- Return ONLY a single JSON object and nothing else (no commentary, no explanation).
- The JSON must match this schema exactly:
{
  "rankings": [
    { "vendorId": "<id>", "score": <number 0-10>, "summary": "<short summary>" }
  ],
  "recommended": { "vendorId": "<id>", "reason": "<one-sentence reason>" },
  "savings": <number|null>  // total savings relative to budget (positive if under budget or 0), or null
}

- If savings aren't applicable, set "savings": null.
- Do not include any extra fields.
- Output must be valid JSON. If your output includes code fences, put only the JSON inside the code fence.

Now produce the JSON only.
`;


  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  })

 try {
    return parseAIJson(response.text);
    
  } catch (err) {
    console.error('Failed to parse AI response as JSON:', err.message);
    console.log('Raw response:', response.text);
  }
}

module.exports = {toRFP,parseVendorResponse,compareProposals}
