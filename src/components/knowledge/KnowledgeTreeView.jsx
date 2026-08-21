import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, BookOpen, FolderOpen, Folder, FileText, Eye, Edit2, Trash2, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const getCategoryColor = (category) => {
  const colors = {
    implementation_guide: 'bg-blue-100 text-blue-700',
    best_practice: 'bg-green-100 text-green-700',
    policy_template: 'bg-purple-100 text-purple-700',
    procedure: 'bg-amber-100 text-amber-700',
    checklist: 'bg-pink-100 text-pink-700',
  };
  return colors[category] || 'bg-slate-100 text-slate-700';
};

const getStatusColor = (status) => ({
  draft: 'bg-slate-100 text-slate-600',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-slate-100 text-slate-500',
}[status] || 'bg-slate-100 text-slate-600');

function ArticleNode({ article, onView, onDelete }) {
  return (
    <div className="flex items-center justify-between group p-2.5 ml-10 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
        <div className="min-w-0">
          <span className="text-sm font-medium text-slate-800 truncate block">{article.title}</span>
          <div className="flex gap-1.5 mt-0.5 flex-wrap">
            {article.category && (
              <Badge className={`text-xs py-0 ${getCategoryColor(article.category)}`}>
                {article.category.replace(/_/g, ' ')}
              </Badge>
            )}
            <Badge className={`text-xs py-0 ${getStatusColor(article.status)}`}>
              {article.status || 'draft'}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onView(article)}>
          <Eye className="w-3.5 h-3.5 text-slate-500" />
        </Button>
        {article.pdf_url && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(article.pdf_url, '_blank')}>
            <Download className="w-3.5 h-3.5 text-slate-500" />
          </Button>
        )}
        <Link to={createPageUrl(`KnowledgeArticleDetail?id=${article.id}`)}>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
          </Button>
        </Link>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDelete(article.id)}>
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </Button>
      </div>
    </div>
  );
}

function ChapterNode({ chapter, articles, onView, onDelete }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="ml-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-slate-100 transition-colors group"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
        {expanded ? (
          <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
        )}
        <span className="text-sm font-semibold text-slate-700">{chapter}</span>
        <span className="text-xs text-slate-400 ml-1">({articles.length})</span>
      </button>
      {expanded && (
        <div className="space-y-0.5 mt-0.5">
          {articles.map(article => (
            <ArticleNode key={article.id} article={article} onView={onView} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function FrameworkNode({ frameworkName, chapters, onView, onDelete }) {
  const [expanded, setExpanded] = useState(true);
  const totalArticles = Object.values(chapters).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full text-left p-4 hover:bg-slate-50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-slate-900">{frameworkName}</span>
          <span className="text-xs text-slate-500 ml-2">{Object.keys(chapters).length} chapters · {totalArticles} articles</span>
        </div>
      </button>
      {expanded && (
        <div className="pb-3 space-y-1 border-t border-slate-100 pt-2">
          {Object.entries(chapters).map(([chapter, articles]) => (
            <ChapterNode
              key={chapter}
              chapter={chapter}
              articles={articles}
              onView={onView}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function KnowledgeTreeView({ articles, frameworks, onView, onDelete }) {
  // Build tree: frameworkId -> chapter -> articles[]
  const tree = {};

  articles.forEach(article => {
    const fw = frameworks.find(f => f.id === article.framework_id);
    const fwKey = fw ? fw.id : '__none__';
    const fwName = fw ? fw.name : 'No Framework';
    const chapter = article.chapter || 'General';

    if (!tree[fwKey]) tree[fwKey] = { name: fwName, chapters: {} };
    if (!tree[fwKey].chapters[chapter]) tree[fwKey].chapters[chapter] = [];
    tree[fwKey].chapters[chapter].push(article);
  });

  return (
    <div className="space-y-4">
      {Object.entries(tree)
        .sort(([, a], [, b]) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
        .map(([fwId, { name, chapters }]) => (
        <FrameworkNode
          key={fwId}
          frameworkName={name}
          chapters={chapters}
          onView={onView}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}