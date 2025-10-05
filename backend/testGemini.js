// test-gemini.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

(async () => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello Gemini!");
    console.log("✅ API key working!");
    console.log(result.response.text());
  } catch (err) {
    console.error("❌ API key error:", err.message);
  }
})();
