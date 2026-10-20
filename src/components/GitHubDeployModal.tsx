import React, { useState } from 'react';
import {
  X,
  Github,
  Check,
  Copy,
  Terminal,
  ExternalLink,
  ShieldCheck,
  CloudUpload,
  FolderGit2,
  GitBranch,
  Sparkles,
} from 'lucide-react';

interface GitHubDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export function GitHubDeployModal({
  isOpen,
  onClose,
  userEmail = 'darboejuloo1@gmail.com',
}: GitHubDeployModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const gitCommands = [
    {
      title: '1. Push Latest Fixes to GitHub',
      desc: 'Commit and push the relative asset fixes, .nojekyll, and GitHub Actions workflow:',
      command: `git add .\ngit commit -m "fix(gh-pages): enable relative asset paths and github actions workflow"\ngit push -u origin main`,
    },
    {
      title: '2. Enable GitHub Pages in 1-Click (Settings)',
      desc: 'In your GitHub repository (Ojudee/invoice-packages):',
      command: `1. Go to repository "Settings" tab\n2. Click "Pages" on the left menu\n3. Under "Build and deployment" > "Source", select: "GitHub Actions"\n4. GitHub automatically builds and deploys to: https://ojudee.github.io/invoice-packages/`,
    },
    {
      title: 'Alternative: Deploy via Terminal (gh-pages branch)',
      desc: 'Build and deploy directly from your command line in one command:',
      command: `npm run deploy`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0b2341] to-slate-950 px-6 py-4 border-b border-blue-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white text-slate-950 rounded-xl font-black">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>DEPLOY TO GITHUB</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                  GIT READY
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                The repository is initialized with branch <code className="font-mono text-amber-300">main</code> and pristine production code.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Status summary banner */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-900/50 border border-emerald-500/40 rounded-lg text-emerald-400">
                <FolderGit2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                  <span>Repository: Ojudee/invoice-packages • main</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Configured author: <span className="text-slate-200 font-mono">{userEmail}</span>
                </div>
              </div>
            </div>

            <a
              href="https://github.com/Ojudee/invoice-packages/settings/pages"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition"
            >
              <span>GitHub Pages Settings</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* GitHub Pages Load Fix Banner */}
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 text-xs text-emerald-200 space-y-1.5">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>GitHub Pages Blank Screen Issue Resolved:</span>
            </div>
            <p className="text-[11px] text-emerald-100/90 leading-relaxed">
              1. <strong>Relative Assets (base: './')</strong>: Built scripts and stylesheets now use relative paths, preventing 404 errors on repo subpaths.<br/>
              2. <strong>Jekyll Bypass (.nojekyll)</strong>: Added to ensure GitHub Pages does not ignore underscore or minified assets.<br/>
              3. <strong>Automated Actions (.github/workflows/deploy.yml)</strong>: Automatically compiles TypeScript/Vite on every push to main.
            </p>
          </div>

          {/* Quick Steps */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4" />
              <span>Step-by-Step Deployment Instructions</span>
            </h3>

            {gitCommands.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{item.title}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(item.command, idx)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">{item.desc}</p>

                <pre className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre">
                  {item.command}
                </pre>
              </div>
            ))}
          </div>

          {/* CI/CD & Cloud Hosting Integration */}
          <div className="bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-900/50 rounded-xl p-4">
            <h4 className="text-xs font-bold text-blue-300 flex items-center gap-1.5 mb-2">
              <CloudUpload className="w-4 h-4 text-blue-400" />
              <span>Hosting Your Production Web App After GitHub Push</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Once pushed to GitHub, you can import the repository directly with zero configuration into:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-xs">
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2">
                <span className="font-bold text-white block">▲ Vercel</span>
                <span className="text-[11px] text-slate-400">Import Git Repo → Auto Deploy with 1-click</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2">
                <span className="font-bold text-white block">◆ Netlify</span>
                <span className="text-[11px] text-slate-400">Build Command: <code className="text-amber-400">npm run build</code></span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2">
                <span className="font-bold text-white block">☁ Cloud Run / Docker</span>
                <span className="text-[11px] text-slate-400">Containerized Google Cloud or VPS hosting</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Includes complete README.md, package configuration, and clean build assets.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
