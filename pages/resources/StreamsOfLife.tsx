import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText, Download, BookOpen } from 'lucide-react';

const PDF_PATH = '/coaching-resources/streams-of-life.pdf';

export const StreamsOfLife: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-1.5 text-sm text-slate-500">
          <Link to="/resources" className="hover:text-emerald-700 transition-colors font-medium">Resources</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-slate-900 font-medium">Streams of Life</span>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16">

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wide">Worksheet</span>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">Self-discovery</span>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">Life Coaching</span>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">Reflection Tool</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-extrabold text-slate-900 leading-tight mb-4">
            Streams of Life
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            A reflective coaching tool to help clients explore the key areas of their life, identify where they are thriving, and decide where to focus their energy.
          </p>

          {/* PDF download CTA */}
          <div className="flex items-center gap-3 mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">Streams of Life — Worksheet</p>
              <p className="text-xs text-slate-500">Free PDF download</p>
            </div>
            <a
              href={PDF_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          </div>
        </header>

        {/* Article body */}
        <div className="prose prose-slate prose-lg max-w-none">

          <h2>What is the Streams of Life tool?</h2>
          <p>
            The Streams of Life worksheet is a powerful visual coaching exercise that invites clients to reflect on the major areas of their life — often called "streams" — and assess how each one is flowing. Much like a river made up of many tributaries, a fulfilling life draws from multiple sources of meaning and energy.
          </p>
          <p>
            By mapping out each stream, clients can quickly see where life feels abundant and where it feels blocked, stagnant, or neglected. This creates a natural foundation for goal-setting and prioritisation within a coaching conversation.
          </p>

          <h2>How to use this worksheet</h2>
          <p>
            This tool works well as a session opener or as pre-session homework. Here's how to get the most out of it:
          </p>
          <ol>
            <li><strong>Complete the worksheet:</strong> Invite your client to score each stream on a simple scale (1–10), rating how satisfied or energised they feel in that area right now.</li>
            <li><strong>Explore the picture:</strong> Use open coaching questions to explore the high scores and the low ones. What does a 3 look like for them? What would a 9 feel like?</li>
            <li><strong>Identify focus areas:</strong> Together, agree which one or two streams feel most important to focus on. The goal isn't to score a 10 across the board — it's to find the right balance for this person at this time.</li>
            <li><strong>Set the agenda:</strong> Use the insights to shape the coaching engagement. The streams that score lowest often hold the most potential for meaningful change.</li>
          </ol>

          <h2>The streams covered</h2>
          <p>
            The worksheet covers the core areas that most clients identify as central to a well-rounded life:
          </p>
          <ul>
            <li><strong>Career &amp; Purpose</strong> — Work, calling, contribution</li>
            <li><strong>Relationships</strong> — Family, friends, intimate partnerships</li>
            <li><strong>Health &amp; Wellbeing</strong> — Physical, mental, and emotional health</li>
            <li><strong>Finances</strong> — Security, freedom, and relationship with money</li>
            <li><strong>Personal Growth</strong> — Learning, creativity, and self-development</li>
            <li><strong>Fun &amp; Recreation</strong> — Joy, hobbies, and rest</li>
            <li><strong>Environment</strong> — Home, surroundings, and sense of place</li>
          </ul>

          <h2>Why this works</h2>
          <p>
            One of the most common challenges clients face is knowing <em>where to start</em>. Life can feel overwhelming in its entirety. The Streams of Life tool breaks that overwhelm down into distinct, manageable areas — giving both coach and client a shared language and a clear visual to return to throughout the engagement.
          </p>
          <p>
            It also surfaces blind spots. Clients are often so focused on one struggling stream (typically career or relationships) that they overlook the energy available in other streams that could help fuel progress everywhere.
          </p>

          <h2>Tip for coaches</h2>
          <p>
            Avoid rushing to solutions when low scores appear. Instead, sit with curiosity. Ask: <em>"What has been getting in the way here?"</em> and <em>"What would it mean for you if this stream were flowing freely?"</em> The richest coaching conversations often begin right at the threshold of a low score.
          </p>
        </div>

        {/* Bottom download reminder */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-800 text-sm">Download the worksheet</p>
            <p className="text-xs text-slate-500 mt-0.5">Free PDF — print or use digitally in sessions</p>
          </div>
          <a
            href={PDF_PATH}
            download
            className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </a>
        </div>

        {/* Back link */}
        <div className="mt-8">
          <Link to="/resources" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-emerald-700 transition-colors">
            <BookOpen className="h-4 w-4" />
            Back to all resources
          </Link>
        </div>
      </article>
    </div>
  );
};
