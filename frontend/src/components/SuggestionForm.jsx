import React, { useState } from "react";
import { getDatabase, ref, push } from "firebase/database";
import { useNavigate } from "react-router-dom"; // ✅ Added
import {
  MessageSquare,
  User,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function SuggestionForm() {
  const [name, setName] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate(); // ✅ Added

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recommendation.trim()) {
      setSuccess("Please enter a recommendation before submitting.");
      return;
    }

    setLoading(true);
    const db = getDatabase();

    try {
      const now = new Date();
      const dateKey = now.toISOString().split("T")[0];

      await push(ref(db, `suggestions/${dateKey}`), {
        name: name.trim() || "Anonymous",
        recommendation: recommendation.trim(),
        timestamp: now.toISOString(),
      });

      setSuccess("Thank you for your feedback!");
      setName("");
      setRecommendation("");

      // 🔹 REFRESH page instead of redirect
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      setSuccess("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mt-10 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">
          Comments & Suggestions
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Input */}
        <div>
          <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" /> Name (optional)
          </label>
          <input
            type="text"
            placeholder="Enter your name or leave blank"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Recommendation Input */}
        <div>
          <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-gray-500" /> Your
            Recommendation
          </label>
          <textarea
            placeholder="Share your thoughts, feedback, or ideas..."
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            rows="5"
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-200 ${
              loading
                ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <Send className="w-5 h-5" />
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>

      {/* Status Message */}
      {success && (
        <div
          className={`mt-6 flex items-center gap-3 p-4 rounded-lg ${
            success === "Thank you for your feedback!"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {success === "Thank you for your feedback!" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p className="font-medium">{success}</p>
        </div>
      )}
    </div>
  );
}
