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
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [isSafetyExpanded, setIsSafetyExpanded] = useState(false);
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
            {/* Executive Summary - Enhanced Visual Cards */}
            {(() => {
              if (!analysis.analysis) return null;

              const execMatch = analysis.analysis.match(
                /### \*\*Executive Summary\*\*([\s\S]*?)(?=###|$)/
              );
              if (!execMatch) return null;

              const execText = execMatch[1].trim();

              // Extract key numbers and facts
              const totalEvents = execText.match(
                /total of \*\*(\d+) earthquake events?\*\*/
              )?.[1];
              const mainLocation = execText.match(
                /observed in \*\*([^*]+)\*\*/
              )?.[1];
              const magnitudeRange = execText.match(/\(M([\d.]+)-M([\d.]+)\)/);

              // Clean the text by removing markdown asterisks
              const cleanText = execText.replace(/\*\*/g, "");

              return (
                <div className="space-y-4">
                  {/* Executive Summary Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-md">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Executive Summary
                    </h3>
                  </div>

                  {/* Key Metrics Row - Enhanced */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {totalEvents && (
                      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-5 shadow-lg transform hover:scale-105 transition-transform">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-8 -mt-8"></div>
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-5 h-5 text-white" />
                            <span className="text-xs font-semibold text-white uppercase tracking-wide">
                              Recent Activity
                            </span>
                          </div>
                          <p className="text-5xl font-extrabold text-white mb-1">
                            {totalEvents}
                          </p>
                          <p className="text-sm text-white text-opacity-90 font-medium">
                            earthquake events detected
                          </p>
                          <div className="mt-3 pt-3 border-t border-white border-opacity-20">
                            <p className="text-xs text-white text-opacity-80">
                              Last 1 hour period
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {mainLocation && (
                      <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 shadow-lg transform hover:scale-105 transition-transform">
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-5 h-5 text-white" />
                            <span className="text-xs font-semibold text-white uppercase tracking-wide">
                              Hotspot Zone
                            </span>
                          </div>
                          <p className="text-xl font-bold text-white leading-tight mb-2 min-h-[3rem] flex items-center">
                            {mainLocation}
                          </p>
                          <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-lg px-3 py-2">
                            <AlertTriangle className="w-4 h-4 text-white" />
                            <span className="text-xs text-white font-semibold">
                              Persistent swarm activity
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {magnitudeRange && (
                      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 shadow-lg transform hover:scale-105 transition-transform">
                        <div className="absolute top-0 left-0 w-20 h-20 bg-white opacity-10 rounded-full -ml-8 -mt-8"></div>
                        <div className="absolute bottom-0 right-0 w-28 h-28 bg-white opacity-10 rounded-full -mr-12 -mb-12"></div>
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-3">
                            <Gauge className="w-5 h-5 text-white" />
                            <span className="text-xs font-semibold text-white uppercase tracking-wide">
                              Magnitude Range
                            </span>
                          </div>
                          <p className="text-4xl font-extrabold text-white mb-1">
                            M{magnitudeRange[1]}-{magnitudeRange[2]}
                          </p>
                          <p className="text-sm text-white text-opacity-90 font-medium">
                            Moderate intensity events
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-white" />
                            <span className="text-xs text-white text-opacity-80">
                              Requires monitoring
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Key Insight Card - Enhanced */}
                  <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl p-6 shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                    <div className="relative flex items-start gap-4">
                      <div className="bg-white bg-opacity-20 p-3 rounded-xl flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-bold text-white text-lg">
                            🎯 Key Observation
                          </h4>
                          <Sparkles className="w-4 h-4 text-yellow-300" />
                        </div>
                        <p className="text-white text-opacity-95 leading-relaxed font-medium">
                          {cleanText
                            .split(/\.\s+/)
                            .find(
                              (s) =>
                                s.includes("clustering") ||
                                s.includes("warrants") ||
                                s.includes("monitoring")
                            )}
                          .
                        </p>
                        <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                          <div className="flex items-center gap-2 text-white text-opacity-80 text-sm">
                            <Brain className="w-4 h-4" />
                            <span>AI-powered seismic pattern analysis</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Active Regions Card */}
            {(() => {
              if (!analysis.analysis || isAnalysisExpanded) return null;

              const locationMatches = [
                ...analysis.analysis.matchAll(
                  /#### \*\*\d+\. (.*?)\*\*\s*\n\s*\*\s*\*\*Total Events:\*\*\s*(\d+)/g
                ),
              ];

              if (locationMatches.length > 0) {
                return (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      Most Active Regions
                    </h4>
                    <div className="space-y-2">
                      {locationMatches.slice(0, 3).map((match, idx) => {
                        const location = match[1].replace(/\(.*?\)/, "").trim();
                        const events = match[2];

                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white rounded px-3 py-2"
                          >
                            <span className="text-gray-700 font-medium text-sm">
                              {location}
                            </span>
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold text-xs">
                              {events} events
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Read More Button for Analysis */}
            {!isAnalysisExpanded && (
              <div className="text-center">
                <button
                  onClick={() => setIsAnalysisExpanded(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
                >
                  <Activity className="w-4 h-4" />
                  Read Full Detailed Analysis
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Full Analysis - Each Section as Card */}
            {isAnalysisExpanded && analysis.analysis && (
              <div className="space-y-3">
                {/* Render formatted analysis with sections as cards */}
                {(() => {
                  const sections = [];
                  const text = analysis.analysis;

                  // Split by main headers
                  const parts = text.split(/###\s+\*\*(.+?)\*\*/g);

                  for (let i = 1; i < parts.length; i += 2) {
                    const title = parts[i];
                    const content = parts[i + 1]?.trim();

                    if (!content) continue;

                    // Skip Public Awareness section
                    if (
                      title ===
                      "Public Awareness and Safety Tips for Affected Locations"
                    ) {
                      continue;
                    }

                    // Check if this is a location detail section
                    if (
                      title ===
                      "Detailed Analysis Per Location and Area of Concern"
                    ) {
                      const locations = content.split(/####\s+\*\*(.+?)\*\*/g);

                      for (let j = 1; j < locations.length; j += 2) {
                        const locTitle = locations[j];
                        const locContent = locations[j + 1]?.trim();

                        if (!locContent) continue;

                        // Clean content by removing markdown
                        const cleanLocContent = locContent.replace(/\*\*/g, "");

                        // Extract structured data from content
                        const totalEventsMatch = cleanLocContent.match(
                          /Total Events:\s*(\d+)/
                        );
                        const maxMagMatch = cleanLocContent.match(
                          /Max Magnitude:\s*([\d.]+)/
                        );
                        const avgMagMatch = cleanLocContent.match(
                          /Avg Magnitude:\s*~?([\d.]+)/
                        );
                        const activityLevelMatch = cleanLocContent.match(
                          /Seismic Activity Level:\s*(\w+)/
                        );

                        // Extract key insights (first meaningful sentence from Patterns/Clusters or Areas of Concern)
                        const insightMatch = cleanLocContent.match(
                          /(?:Patterns\/Clusters|Areas of Concern):\s*([^*\n]+)/
                        );

                        const activityLevel =
                          activityLevelMatch?.[1] || "Unknown";
                        const levelColors = {
                          High: {
                            bg: "bg-red-50",
                            border: "border-red-200",
                            text: "text-red-700",
                            badge: "bg-red-100",
                          },
                          Moderate: {
                            bg: "bg-yellow-50",
                            border: "border-yellow-200",
                            text: "text-yellow-700",
                            badge: "bg-yellow-100",
                          },
                          Low: {
                            bg: "bg-green-50",
                            border: "border-green-200",
                            text: "text-green-700",
                            badge: "bg-green-100",
                          },
                        };
                        const colors =
                          levelColors[activityLevel] || levelColors["Low"];

                        sections.push(
                          <div
                            key={`loc-${j}`}
                            className={`${colors.bg} rounded-lg p-4 border ${colors.border}`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-2 flex-1">
                                <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0 mt-1" />
                                <h5 className="font-bold text-gray-900 text-sm leading-tight">
                                  {locTitle}
                                </h5>
                              </div>
                              <span
                                className={`${colors.badge} ${colors.text} px-2 py-1 rounded-full text-xs font-bold`}
                              >
                                {activityLevel}
                              </span>
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {totalEventsMatch && (
                                <div className="bg-white rounded p-2">
                                  <p className="text-xs text-gray-600">
                                    Events
                                  </p>
                                  <p className="text-lg font-bold text-gray-900">
                                    {totalEventsMatch[1]}
                                  </p>
                                </div>
                              )}
                              {maxMagMatch && (
                                <div className="bg-white rounded p-2">
                                  <p className="text-xs text-gray-600">
                                    Max Mag
                                  </p>
                                  <p className="text-lg font-bold text-gray-900">
                                    M{maxMagMatch[1]}
                                  </p>
                                </div>
                              )}
                              {avgMagMatch && (
                                <div className="bg-white rounded p-2">
                                  <p className="text-xs text-gray-600">
                                    Avg Mag
                                  </p>
                                  <p className="text-lg font-bold text-gray-900">
                                    ~{avgMagMatch[1]}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Key Insight */}
                            {insightMatch && (
                              <div className="bg-white bg-opacity-50 rounded p-2">
                                <p className="text-xs text-gray-700 leading-relaxed">
                                  {insightMatch[1].trim()}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      }
                    } else {
                      // Regular section as card
                      sections.push(
                        <div
                          key={i}
                          className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <Activity className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <h4 className="font-bold text-gray-900 text-sm">
                              {title}
                            </h4>
                          </div>
                          <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {content}
                          </div>
                        </div>
                      );
                    }
                  }

                  return sections.length > 0 ? (
                    sections
                  ) : (
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {analysis.analysis}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Collapse Analysis Button */}
            {isAnalysisExpanded && (
              <div className="text-center">
                <button
                  onClick={() => setIsAnalysisExpanded(false)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium shadow-sm"
                >
                  <ChevronUp className="w-4 h-4" />
                  Hide Detailed Analysis
                </button>
              </div>
            )}

            {/* Statistics Grid - As Individual Cards */}
            {(analysis.totalEvents ||
              analysis.strongestMagnitude ||
              analysis.mostActiveRegion ||
              analysis.avgDepth) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {analysis.totalEvents && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
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
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
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
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
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
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
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

            {/* Safety Guidelines Button */}
            <div className="text-center pt-4 border-t-2 border-gray-200">
              <button
                onClick={() => setIsSafetyExpanded(!isSafetyExpanded)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <Info className="w-4 h-4" />
                {isSafetyExpanded ? "Hide" : "View"} Safety Guidelines
                {isSafetyExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
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

      {/* Safety Guidelines Section */}
      {isSafetyExpanded && (
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
