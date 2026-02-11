import React from 'react';
import { Github } from 'lucide-react';

const Footer = () => {
    return (
        <div className="py-6 text-center border-t border-slate-100/10">
            <div className="inline-flex flex-col items-center">
                <div className="w-12 h-1 border-t-2 border-slate-200 mb-4 opacity-10"></div>
                <p className="text-slate-600 text-sm font-black uppercase tracking-[0.15em]">
                    © {new Date().getFullYear()} GATI REHAB
                </p>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mt-4 max-w-md mx-auto leading-relaxed">
                    Measurements are approximate and intended for rehabilitation guidance only
                </p>
                <div className="flex items-center gap-4 mt-6">
                    <a
                        href="https://github.com/Heal-gorithms/Gati-rehab"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600 hover:text-slate-900 font-bold text-xs uppercase tracking-wider group"
                    >
                        <Github className="w-4 h-4" />
                        Open Source
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Footer;