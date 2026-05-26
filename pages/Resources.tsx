import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, ArrowRight, Lock } from 'lucide-react';

const FREE_RESOURCES = [
  {
    slug: '/how-to-find-a-certified-verified-coach',
    title: 'How to Find a Certified Coach',
    excerpt: 'The complete 6-step guide to finding a qualified, verified coaching professional — what accreditation means, how to check credentials, and what to ask before you commit.',
    tags: ['Guide', 'Client Resource', 'Accreditation'],
    type: 'Article',
    readTime: '8 min read',
    pdfPath: null,
  },
  {
    slug: 'streams-of-life',
    title: 'Streams of Life',
    excerpt: 'A reflective coaching tool exploring the key streams of life — career, relationships, health, purpose and more — to help clients gain perspective and identify where to focus energy.',
    tags: ['Self-discovery', 'Life Coaching', 'Reflection Tool'],
    type: 'Worksheet',
    readTime: '5 min read',
    pdfPath: '/coaching-resources/streams-of-life.pdf',
  },
];

export const Resources: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-b border-emerald-100 py-14 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <BookOpen className="h-4 w-4" />
            Coaching Resources
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-extrabold text-slate-900 mb-4 leading-tight">
            Tools to support your coaching practice
          </h1>
          <p className="text-lg text-slate-600">
            Free resources for coaches and clients to use in sessions and personal development.
          </p>
        </div>
      </section>

      {/* Article listing */}
      <section className="py-14 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-display font-extrabold text-slate-900">Free Resources</h2>
            <span className="text-sm text-slate-400">Open to everyone, no sign-in required.</span>
          </div>

          <div className="divide-y divide-slate-100">
            {FREE_RESOURCES.map((resource) => (
              <article key={resource.slug} className="py-8 first:pt-0">
                <div className="flex items-start gap-5">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1 p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <FileText className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Tags + meta */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                        {resource.type}
                      </span>
                      {resource.tags.map((tag) => (
                        <span key={tag} className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                      <span className="text-xs text-slate-400 ml-auto">{resource.readTime}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-display font-bold text-slate-900 mb-2 leading-snug">
                      <Link
                        to={resource.slug.startsWith('/') ? resource.slug : `/resources/${resource.slug}`}
                        className="hover:text-emerald-700 transition-colors"
                      >
                        {resource.title}
                      </Link>
                    </h3>

                    {/* Excerpt */}
                    <p className="text-slate-500 text-sm leading-relaxed mb-4">{resource.excerpt}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                      <Link
                        to={resource.slug.startsWith('/') ? resource.slug : `/resources/${resource.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                      >
                        Read article <ArrowRight className="h-4 w-4" />
                      </Link>
                      {!!resource.pdfPath && (
                        <a
                          href={resource.pdfPath}
                          download
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <FileText className="h-4 w-4" /> Download PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Premium note */}
          <div className="mt-10 pt-8 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
            <Lock className="h-4 w-4 text-amber-500 flex-shrink-0" />
            CoachDog members can also access{' '}
            <Link to="/resources/premium" className="text-amber-600 hover:text-amber-700 font-semibold underline underline-offset-2">
              premium resources
            </Link>
            .
          </div>
        </div>
      </section>
    </div>
  );
};
