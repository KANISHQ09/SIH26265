"use client";

import React, { useState } from "react";
import { X, Play, Pause, Volume2, VolumeX, RotateCcw, Clock, Shield } from "lucide-react";
import Image from "next/image";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<"video" | "transcript" | "summary">("video");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-[#1c1917] text-stone-100 rounded-2xl shadow-2xl z-10 overflow-hidden my-6 border border-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800/80 bg-stone-900/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h4 className="font-serif text-lg text-stone-200">
              A Quiet Introduction — Clarity When Everything Looks Fine
            </h4>
            <span className="text-xs text-stone-400 border border-stone-700 px-2 py-0.5 rounded-full">
              4:12
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video simulation area */}
        <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center group">
          <Image
            src="/coach_intro_thumbnail.jpg"
            alt="Executive advisory introduction preview"
            fill
            className={`object-cover transition-opacity duration-500 ${isPlaying ? "opacity-90" : "opacity-60"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/40" />

          {/* Central play overlay when paused */}
          {!isPlaying && (
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute w-20 h-20 rounded-full bg-amber-500/90 text-stone-950 flex items-center justify-center shadow-xl hover:scale-105 transition-all"
            >
              <Play size={32} className="ml-1" fill="currentColor" />
            </button>
          )}

          {/* Subtitle overlay */}
          <div className="absolute bottom-16 inset-x-8 text-center pointer-events-none">
            <p className="inline-block bg-black/75 backdrop-blur-sm text-stone-200 text-sm sm:text-base px-4 py-1.5 rounded-lg font-serif">
              &ldquo;Most leaders don&apos;t fail from lack of intellect. They stagnate from carrying unresolved internal resistance in silence.&rdquo;
            </p>
          </div>

          {/* Video bottom control bar */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4 flex items-center justify-between text-xs text-stone-300">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="hover:text-amber-400 transition-colors"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="hover:text-amber-400 transition-colors"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <span>01:48 / 04:12</span>
            </div>

            {/* Simulated progress bar */}
            <div className="flex-1 mx-6 h-1 bg-stone-700 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 w-[42%]" />
            </div>

            <div className="flex items-center gap-2">
              <Shield size={14} className="text-amber-400" />
              <span className="text-[11px] text-stone-400">Private Stream</span>
            </div>
          </div>
        </div>

        {/* Tabbed notes below video */}
        <div className="p-6 bg-stone-900">
          <div className="flex gap-4 border-b border-stone-800 pb-3 text-xs uppercase tracking-wider font-medium text-stone-400">
            <button
              onClick={() => setActiveTab("video")}
              className={`pb-1 ${activeTab === "video" ? "text-amber-400 border-b-2 border-amber-400 font-semibold" : "hover:text-stone-200"}`}
            >
              Key Takeaways
            </button>
            <button
              onClick={() => setActiveTab("transcript")}
              className={`pb-1 ${activeTab === "transcript" ? "text-amber-400 border-b-2 border-amber-400 font-semibold" : "hover:text-stone-200"}`}
            >
              Transcript Excerpt
            </button>
            <button
              onClick={() => setActiveTab("summary")}
              className={`pb-1 ${activeTab === "summary" ? "text-amber-400 border-b-2 border-amber-400 font-semibold" : "hover:text-stone-200"}`}
            >
              The 3-Part Framework
            </button>
          </div>

          <div className="pt-4 text-sm text-stone-300">
            {activeTab === "video" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-stone-800/60 border border-stone-700/50">
                  <div className="text-amber-400 text-xs font-semibold mb-1">01. The Silent Plateau</div>
                  <p className="text-xs text-stone-400">When metrics look stellar externally, yet conviction and vitality are decaying internally.</p>
                </div>
                <div className="p-3 rounded-lg bg-stone-800/60 border border-stone-700/50">
                  <div className="text-amber-400 text-xs font-semibold mb-1">02. Beyond Advice</div>
                  <p className="text-xs text-stone-400">Not prescribing generic executive frameworks, but unearthing your own uncontaminated truth.</p>
                </div>
                <div className="p-3 rounded-lg bg-stone-800/60 border border-stone-700/50">
                  <div className="text-amber-400 text-xs font-semibold mb-1">03. Clean Decisiveness</div>
                  <p className="text-xs text-stone-400">Ending the exhaustion of unresolved loops so you can lead with effortless authority.</p>
                </div>
              </div>
            )}

            {activeTab === "transcript" && (
              <div className="max-h-36 overflow-y-auto space-y-2 text-xs text-stone-400 font-serif leading-relaxed pr-2">
                <p><strong className="text-stone-200">00:15:</strong> &ldquo;When you lead a significant organization, almost everyone has an agenda for your time, your conviction, and your validation. The board wants stability, the team wants certainty, the market wants growth.&rdquo;</p>
                <p><strong className="text-stone-200">01:04:</strong> &ldquo;Very few spaces exist where you don&apos;t have to wear the armor. Where you can say aloud: &apos;I don&apos;t know what to do about this co-founder,&apos; or &apos;I don&apos;t care about this goal anymore, even though we just hit $30M ARR.&apos;&rdquo;</p>
                <p><strong className="text-stone-200">02:22:</strong> &ldquo;This work is that quiet clearing. We unpack the noise, separate fact from fear, and return to grounded simplicity.&rdquo;</p>
              </div>
            )}

            {activeTab === "summary" && (
              <div className="text-xs text-stone-400 space-y-1.5 leading-relaxed">
                <p>• <strong className="text-stone-200">Format:</strong> 90-minute structured dialogue via end-to-end encrypted video, preceded by a targeted intake reflection.</p>
                <p>• <strong className="text-stone-200">Output:</strong> A 1-page distillation memo of core decisions, boundaries, and immediate pivots.</p>
                <p>• <strong className="text-stone-200">Strict Cap:</strong> We maintain a maximum of 6 concurrent executive relationships per quarter.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
