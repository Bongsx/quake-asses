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
  Shield,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase/firebaseClient";
import React from "react";

const AiAlert = () => {
  const [analysis, setAnalysis] = useState(null);
  const [isSafetyExpanded, setIsSafetyExpanded] = useState(false);
  const [showLocationSummaries, setShowLocationSummaries] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    const stats = calculateStatistics();
    setStatistics(stats);
  }, [analysis]);

  useEffect(() => {
    const analysisRef = ref(db, "aiAnalysis/last");
    const unsubscribe = onValue(analysisRef, (snapshot) => {
      const data = snapshot.val();
      console.log("AI Analysis Data:", data);
      setAnalysis(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isValidDate = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const getRiskLevel = () => {
    if (!analysis?.riskLevel)
      return {
        color: "gray",
        label: "Unknown",
        bg: "bg-gray-100",
        text: "text-gray-700",
        border: "border-gray-300",
        icon: AlertCircle,
      };

    const level = analysis.riskLevel.toLowerCase();
    if (level === "low")
      return {
        color: "green",
        label: "Low Risk",
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-300",
        icon: CheckCircle,
      };
    if (level === "moderate")
      return {
        color: "yellow",
        label: "Moderate Risk",
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        border: "border-yellow-300",
        icon: AlertCircle,
      };
    if (level === "high")
      return {
        color: "red",
        label: "High Risk",
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-300",
        icon: AlertTriangle,
      };
    if (level === "critical")
      return {
        color: "red",
        label: "Critical Risk",
        bg: "bg-red-200",
        text: "text-red-900",
        border: "border-red-500",
        icon: AlertTriangle,
      };
    return {
      color: "gray",
      label: level,
      bg: "bg-gray-100",
      text: "text-gray-700",
      border: "border-gray-300",
      icon: AlertCircle,
    };
  };

  const getLocationRiskConfig = (riskLevel) => {
    const level = riskLevel?.toLowerCase() || "unknown";

    if (level === "critical")
      return {
        bg: "bg-gradient-to-br from-red-500 to-red-700",
        badge: "bg-red-900 text-red-100",
        icon: AlertTriangle,
        label: "CRITICAL",
      };
    if (level === "high")
      return {
        bg: "bg-gradient-to-br from-orange-500 to-red-600",
        badge: "bg-red-800 text-red-100",
        icon: AlertTriangle,
        label: "HIGH",
      };
    if (level === "moderate")
      return {
        bg: "bg-gradient-to-br from-yellow-500 to-orange-500",
        badge: "bg-orange-800 text-orange-100",
        icon: AlertCircle,
        label: "MODERATE",
      };
    if (level === "low")
      return {
        bg: "bg-gradient-to-br from-green-500 to-emerald-600",
        badge: "bg-green-800 text-green-100",
        icon: CheckCircle,
        label: "LOW",
      };
    return {
      bg: "bg-gradient-to-br from-gray-500 to-gray-600",
      badge: "bg-gray-800 text-gray-100",
      icon: AlertCircle,
      label: "UNKNOWN",
    };
  };

  const cleanLocationName = (location) => {
    return location
      .replace(/^\d+-km-[NSEW]-\d+°-[NSEW]-of-/i, "")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const extractLocationAnalysis = (location) => {
    if (!analysis?.analysis) return null;

    const cleanName = cleanLocationName(location);
    const text = analysis.analysis;

    // Try to find the location-specific section
    const patterns = [
      new RegExp(
        `\\*\\*.*?${cleanName}.*?\\*\\*([\\s\\S]*?)(?=\\*\\*\\d+\\.|###|---(?!-))`
      ),
      new RegExp(
        `${cleanName}[^*]*?\\*\\*([\\s\\S]*?)(?=\\*\\*\\d+\\.|###|---(?!-))`
      ),
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let content = match[1].trim();

        // Extract key information
        const concernMatch = content.match(
          /\*\s\*\*Areas of Concern:\*\*\s*(.*?)(?=\*\s\*\*|$)/s
        );
        const patternsMatch = content.match(
          /\*\s\*\*Patterns or Clusters Observed:\*\*\s*(.*?)(?=\*\s\*\*|$)/s
        );

        if (concernMatch || patternsMatch) {
          return {
            concerns: concernMatch ? concernMatch[1].trim() : null,
            patterns: patternsMatch ? patternsMatch[1].trim() : null,
          };
        }
      }
    }

    return null;
  };

  const calculateStatistics = () => {
    if (!analysis?.locationSummaries) return null;

    const summaries = Object.values(analysis.locationSummaries);
    const totalEvents = summaries.reduce(
      (sum, loc) => sum + (loc.totalEvents || 0),
      0
    );
    const strongestMagnitude = Math.max(
      ...summaries.map((loc) => loc.maxMagnitude || 0)
    );

    // Find most active region
    const sortedByEvents = [...summaries].sort(
      (a, b) => (b.totalEvents || 0) - (a.totalEvents || 0)
    );
    const mostActiveLocation = Object.keys(analysis.locationSummaries).find(
      (key) => analysis.locationSummaries[key] === sortedByEvents[0]
    );
    const mostActiveRegion = mostActiveLocation
      ? cleanLocationName(mostActiveLocation)
      : null;

    // Calculate average depth from events
    let totalDepth = 0;
    let eventCount = 0;
    summaries.forEach((loc) => {
      if (Array.isArray(loc.events)) {
        loc.events.forEach((event) => {
          if (event.depth) {
            totalDepth += event.depth;
            eventCount++;
          }
        });
      }
    });
    const avgDepth =
      eventCount > 0 ? (totalDepth / eventCount).toFixed(1) : null;

    return { totalEvents, strongestMagnitude, mostActiveRegion, avgDepth };
  };

  const extractKeyPoints = () => {
    if (!analysis?.analysis) return [];

    const text = analysis.analysis;
    const points = []; // 1. EXECUTIVE SUMMARY (Look for "Executive Summary" followed by content until the next major header)

    // Loosened RegEx to handle variations in markdown (### **Title**, **Title**, or just Title)

    const execMatch = text.match(
      /Executive\s*Summary[:]?[\s\n]*([\s\S]*?)(?=\s*#+.*[A-Za-z]+.*:?|$)/i
    );
    if (execMatch && execMatch[1].trim().length > 0) {
      const summary = execMatch[1]
        .trim()
        .replace(/[\*#\d\.\s]+/g, " ")
        .trim(); // Clean up residual markdown/list markers
      points.push({
        title: "Executive Summary",
        content: summary,
        icon: BarChart3,
        color: "blue",
      });
    } // 2. OBSERVED PATTERNS (Look for "Patterns" or "Clusters" followed by content)

    const patternsMatch = text.match(
      /Patterns\s*(?:or\s*Clusters)?\s*Observed[:]?[\s\n]*([\s\S]*?)(?=\s*#+.*[A-Za-z]+.*:?|$)/i
    );
    if (patternsMatch && patternsMatch[1].trim().length > 0) {
      const patterns = patternsMatch[1]
        .trim()
        .replace(/[\*#\d\.\s]+/g, " ")
        .trim();
      points.push({
        title: "Observed Patterns",
        content: patterns,
        icon: TrendingUp,
        color: "purple",
      });
    } // 3. AREAS OF CONCERN (Look for "Areas of Concern" followed by content)

    const concernMatch = text.match(
      /Areas\s*of\s*Concern[:]?[\s\n]*([\s\S]*?)(?=\s*#+.*[A-Za-z]+.*:?|$)/i
    );
    if (concernMatch && concernMatch[1].trim().length > 0) {
      const concerns = concernMatch[1]
        .trim()
        .replace(/[\*#\d\.\s]+/g, " ")
        .trim();
      points.push({
        title: "Areas of Concern",
        content: concerns,
        icon: AlertTriangle,
        color: "red",
      });
    }

    console.log("Extracted Key Points:", points);

    return points;
  };

  const riskLevel = getRiskLevel();
  const RiskIcon = riskLevel.icon;
  const keyPoints = extractKeyPoints();

  const locationSummaries = analysis?.locationSummaries
    ? Object.entries(analysis.locationSummaries)
        .filter(([, data]) => {
          const maxMag = data.maxMagnitude ?? 0;
          const nestedMag =
            Array.isArray(data.events) && data.events.length
              ? Math.max(...data.events.map((e) => e.magnitude || 0))
              : 0;
          return Math.max(maxMag, nestedMag) >= 4.0;
        })
        .sort((a, b) => {
          const aMag =
            a[1].maxMagnitude ??
            (Array.isArray(a[1].events) && a[1].events.length
              ? Math.max(...a[1].events.map((e) => e.magnitude || 0))
              : 0);
          const bMag =
            b[1].maxMagnitude ??
            (Array.isArray(b[1].events) && b[1].events.length
              ? Math.max(...b[1].events.map((e) => e.magnitude || 0))
              : 0);
          return bMag - aMag;
        })
        .slice(0, 12)
    : [];

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

  if (analysis?.generatedAt && !isValidDate(analysis.generatedAt)) {
    return null;
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100 mb-6">
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

      <div className="p-6">
        <div className="space-y-6">
          {statistics &&
            (statistics.totalEvents ||
              statistics.strongestMagnitude ||
              statistics.mostActiveRegion ||
              statistics.avgDepth) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statistics.totalEvents && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                        Total Events
                      </span>
                    </div>
                    <p className="text-3xl font-black text-blue-900">
                      {statistics.totalEvents}
                    </p>
                  </div>
                )}

                {statistics.strongestMagnitude && (
                  <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-5 border-2 border-orange-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
                        Strongest
                      </span>
                    </div>
                    <p className="text-3xl font-black text-orange-900">
                      M{statistics.strongestMagnitude}
                    </p>
                  </div>
                )}

                {statistics.mostActiveRegion && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border-2 border-purple-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                        Most Active
                      </span>
                    </div>
                    <p className="text-sm font-bold text-purple-900 leading-tight">
                      {statistics.mostActiveRegion}
                    </p>
                  </div>
                )}

                {statistics.avgDepth && (
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5 border-2 border-teal-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-5 h-5 text-teal-600" />
                      <span className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
                        Avg Depth
                      </span>
                    </div>
                    <p className="text-3xl font-black text-teal-900">
                      {statistics.avgDepth}km
                    </p>
                  </div>
                )}
              </div>
            )}

          {keyPoints.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Key Insights
                  </h3>
                  <p className="text-sm text-gray-500">
                    AI-generated analysis summary
                  </p>
                </div>
              </div>

              {keyPoints.map((point, index) => {
                const Icon = point.icon;
                const colorClasses = {
                  blue: {
                    bg: "bg-blue-50",
                    border: "border-blue-200",
                    icon: "text-blue-600",
                    title: "text-blue-900",
                  },
                  purple: {
                    bg: "bg-purple-50",
                    border: "border-purple-200",
                    icon: "text-purple-600",
                    title: "text-purple-900",
                  },
                  red: {
                    bg: "bg-red-50",
                    border: "border-red-200",
                    icon: "text-red-600",
                    title: "text-red-900",
                  },
                };
                const colors = colorClasses[point.color] || colorClasses.blue;

                return (
                  <div
                    key={index}
                    className={`${colors.bg} border-2 ${colors.border} rounded-xl p-5 shadow-sm`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`font-bold text-lg ${colors.title} mb-3`}
                        >
                          {point.title}
                        </h4>
                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {point.content}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {locationSummaries.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2.5 rounded-xl shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      4.0+ Magnitude Locations
                    </h3>
                    <p className="text-sm text-gray-500">
                      Detailed breakdown by affected areas
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setShowLocationSummaries(!showLocationSummaries)
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg font-medium text-sm"
                >
                  {showLocationSummaries ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show {locationSummaries.length} Locations
                    </>
                  )}
                </button>
              </div>

              {showLocationSummaries && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locationSummaries.length === 0 ? (
                    <p className="text-gray-400 col-span-full text-center">
                      No earthquakes ≥ 4.0 magnitude in the past 24 hours.
                    </p>
                  ) : (
                    locationSummaries.map(([location, data]) => {
                      const totalEvents =
                        data.totalEvents ??
                        (Array.isArray(data.events) ? data.events.length : 0) ??
                        0;

                      const maxMagnitude =
                        data.maxMagnitude ??
                        (Array.isArray(data.events)
                          ? Math.max(
                              ...data.events.map((e) => e.magnitude || 0)
                            )
                          : 0);

                      const avgMagnitude =
                        data.avgMagnitude ??
                        (Array.isArray(data.events) && data.events.length > 0
                          ? (
                              data.events.reduce(
                                (sum, e) => sum + (e.magnitude || 0),
                                0
                              ) / data.events.length
                            ).toFixed(1)
                          : "0.0");

                      const riskLevel = data.riskLevel ?? "unknown";
                      const config = getLocationRiskConfig(riskLevel);
                      const LocationIcon = config.icon;
                      const cleanName = cleanLocationName(location);
                      const locationAnalysis =
                        extractLocationAnalysis(location);

                      return (
                        <div
                          key={location}
                          className={`group relative overflow-hidden ${config.bg} rounded-xl p-5 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300`}
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500"></div>

                          <div className="relative">
                            <div className="flex items-start justify-between mb-3">
                              <div className="bg-red-600 bg-opacity-20 p-2 rounded-lg backdrop-blur-sm">
                                <LocationIcon className="w-5 h-5 text-white" />
                              </div>
                              <div
                                className={`${config.badge} px-2 py-1 rounded-full text-xs font-bold`}
                              >
                                {config.label}
                              </div>
                            </div>

                            <h4 className="text-white font-bold text-base mb-4 leading-tight min-h-[2.5rem]">
                              {cleanName}
                            </h4>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-lg p-2">
                                <p className="text-xs text-black text-opacity-80 mb-1">
                                  Events
                                </p>
                                <p className="text-xl font-black text-black">
                                  {totalEvents}
                                </p>
                              </div>
                              <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-lg p-2">
                                <p className="text-xs text-black text-opacity-80 mb-1">
                                  Max Mag
                                </p>
                                <p className="text-xl font-black text-black">
                                  M{maxMagnitude}
                                </p>
                              </div>
                            </div>

                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-3 py-2 mb-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-black text-opacity-90 font-semibold">
                                  Avg Magnitude
                                </span>
                                <span className="text-sm font-bold text-black">
                                  M{parseFloat(avgMagnitude).toFixed(1)}
                                </span>
                              </div>
                            </div>

                            {locationAnalysis &&
                              (locationAnalysis.concerns ||
                                locationAnalysis.patterns) && (
                                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 border border-white border-opacity-20">
                                  {locationAnalysis.activityLevel && (
                                    <div className="mb-2 pb-2 border-b border-white border-opacity-20">
                                      <p className="text-xs text-white text-opacity-70 font-semibold">
                                        Activity Level:
                                      </p>
                                      <p className="text-sm text-white font-bold">
                                        {locationAnalysis.activityLevel}
                                      </p>
                                    </div>
                                  )}
                                  {locationAnalysis.patterns && (
                                    <div className="mb-2">
                                      <p className="text-xs text-white text-opacity-70 font-semibold mb-1">
                                        Patterns:
                                      </p>
                                      <p className="text-xs text-white text-opacity-90 leading-relaxed">
                                        {locationAnalysis.patterns}
                                      </p>
                                    </div>
                                  )}
                                  {locationAnalysis.concerns && (
                                    <div>
                                      <p className="text-xs text-white text-opacity-70 font-semibold mb-1">
                                        Concerns:
                                      </p>
                                      <p className="text-xs text-white text-opacity-90 leading-relaxed">
                                        {locationAnalysis.concerns}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {analysis.generatedAt && isValidDate(analysis.generatedAt) && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-3 border-t-2 border-gray-200">
              <Clock className="w-4 h-4" />
              <span>
                Last updated: {new Date(analysis.generatedAt).toLocaleString()}
              </span>
              <RefreshCw className="w-3 h-3 ml-1" />
            </div>
          )}

          <div className="text-center pt-2">
            <button
              onClick={() => setIsSafetyExpanded(!isSafetyExpanded)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <Shield className="w-4 h-4" />
              {isSafetyExpanded ? "Hide" : "View"} Safety Guidelines
              {isSafetyExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isSafetyExpanded && (
        <div className="p-6 pt-0 space-y-6">
          <div className="border-t-2 border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Earthquake Safety Guidelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-3 text-sm">
                  Before an Earthquake
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
                <h4 className="font-bold text-green-900 mb-3 text-sm">
                  During an Earthquake
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
                <h4 className="font-bold text-purple-900 mb-3 text-sm">
                  After an Earthquake
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
                <h4 className="font-bold text-red-900 mb-3 text-sm">
                  Emergency Contacts
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
