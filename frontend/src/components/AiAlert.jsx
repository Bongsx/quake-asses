import { useState, useEffect } from "react";
import {
  Brain,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  RefreshCw,
  Activity,
  TrendingUp,
  MapPin,
  Layers,
  BarChart3,
  Gauge,
} from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase/firebaseClient";
import React from "react";

const AiAlert = () => {
  const [analysis, setAnalysis] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analysisRef = ref(db, "aiAnalysis/last");
    const unsubscribe = onValue(analysisRef, (snapshot) => {
      const data = snapshot.val();
      setAnalysis(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Get risk level color scheme
  const getRiskLevel = () => {
    if (!analysis?.riskLevel)
      return {
        color: "gray",
        label: "Unknown",
        bg: "bg-gray-100",
        text: "text-gray-700",
        border: "border-gray-300",
      };

    const level = analysis.riskLevel.toLowerCase();
    if (level === "low")
      return {
        color: "green",
        label: "Low Risk",
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-300",
      };
    if (level === "moderate")
      return {
        color: "yellow",
        label: "Moderate Risk",
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        border: "border-yellow-300",
      };
    if (level === "high")
      return {
        color: "red",
        label: "High Risk",
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-300",
      };
    return {
      color: "gray",
      label: level,
      bg: "bg-gray-100",
      text: "text-gray-700",
      border: "border-gray-300",
    };
  };

  const riskLevel = getRiskLevel();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100 mb-6">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading AI analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100 mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b-2 border-yellow-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-md">
              <Brain className="w-7 h-7 text-orange-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  AI Seismic Analysis
                </h2>
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-gray-600 text-sm">
                Powered by real-time earthquake data analysis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-50 border-b-2 border-blue-100 px-6 py-3">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Important Notice:</span> This is an
            AI-generated assessment based on available seismic data. For
            official warnings and safety advisories, always refer to{" "}
            <a
              href="https://earthquake.phivolcs.dost.gov.ph/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:text-blue-900"
            >
              PHIVOLCS
            </a>{" "}
            and local authorities.
          </p>
        </div>
      </div>

      {/* AI Analysis Content */}
      <div className="p-6">
        {analysis ? (
          <div className="space-y-4">
            {/* Risk Level Badge */}
            <div className="flex items-center gap-3">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${riskLevel.bg} ${riskLevel.border} border-2`}
              >
                <Gauge className={`w-4 h-4 ${riskLevel.text}`} />
                <span className={`font-bold text-sm ${riskLevel.text}`}>
                  {riskLevel.label}
                </span>
              </div>

              {analysis.confidenceLevel && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border-2 border-blue-200">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-sm text-blue-700">
                    {Math.round(analysis.confidenceLevel * 100)}% Confidence
                  </span>
                </div>
              )}
            </div>

            {/* Main Analysis */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">
                    Current Assessment
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {analysis.analysis}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Insights Grid */}
            {(analysis.totalEvents ||
              analysis.strongestMagnitude ||
              analysis.mostActiveRegion ||
              analysis.avgDepth) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {analysis.totalEvents && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">
                        Events Analyzed
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {analysis.totalEvents}
                    </p>
                  </div>
                )}

                {analysis.strongestMagnitude && (
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      <span className="text-xs font-medium text-orange-700">
                        Strongest
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">
                      M{analysis.strongestMagnitude}
                    </p>
                  </div>
                )}

                {analysis.mostActiveRegion && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-700">
                        Most Active
                      </span>
                    </div>
                    <p className="text-sm font-bold text-purple-900">
                      {analysis.mostActiveRegion}
                    </p>
                  </div>
                )}

                {analysis.avgDepth && (
                  <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-4 h-4 text-teal-600" />
                      <span className="text-xs font-medium text-teal-700">
                        Avg Depth
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-teal-900">
                      {analysis.avgDepth}km
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Last Updated */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>
                Last updated: {new Date(analysis.generatedAt).toLocaleString()}
              </span>
              <RefreshCw className="w-3 h-3 ml-1" />
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Read More
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              No AI analysis available at the moment
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Analysis will appear here once generated
            </p>
          </div>
        )}
      </div>

      {/* Expanded Content - Safety Guidelines */}
      {isExpanded && (
        <div className="p-6 pt-0 space-y-6">
          <div className="border-t-2 border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Earthquake Safety Guidelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-3 text-sm flex items-center gap-2">
                  🏠 Before an Earthquake
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Secure heavy furniture and appliances to walls</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      Prepare an emergency kit with food, water, and supplies
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      Identify safe spots in each room (under sturdy tables)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Practice "Drop, Cover, and Hold On" with family</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-bold text-green-900 mb-3 text-sm flex items-center gap-2">
                  ⚡ During an Earthquake
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Drop, cover under sturdy furniture, and hold on</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>
                      Stay away from windows, mirrors, and heavy objects
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>
                      If outdoors, move away from buildings and power lines
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>
                      If in a vehicle, stop safely and stay inside until shaking
                      stops
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-bold text-purple-900 mb-3 text-sm flex items-center gap-2">
                  ✅ After an Earthquake
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>Check yourself and others for injuries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>
                      Be prepared for aftershocks - they can occur hours or days
                      later
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>Inspect your home for damage before entering</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>
                      Listen to local radio or TV for emergency updates
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-bold text-red-900 mb-3 text-sm flex items-center gap-2">
                  📞 Emergency Contacts
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>
                      <strong>PHIVOLCS:</strong> (02) 8426 1468 to 79
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>
                      <strong>NDRRMC Hotline:</strong> 911 or (02) 8911 1406
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>
                      <strong>Emergency Services:</strong> 911
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>
                      <strong>Philippine Red Cross:</strong> 143
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Educational Note */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                How This AI Analysis Works
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Our AI system continuously monitors real-time earthquake data
                from PHIVOLCS, analyzing patterns in magnitude, frequency,
                depth, and geographic distribution. It evaluates multiple
                factors including recent activity trends, earthquake clustering,
                and historical patterns to provide you with contextual insights.
                This helps you stay informed and prepared, though it should
                never replace official warnings from government authorities.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAlert;
