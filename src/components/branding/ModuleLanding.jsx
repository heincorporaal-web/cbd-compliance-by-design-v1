import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ModuleLanding({ brand, Icon, features, logoUrl }) {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Hero */}
      <section
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${brand.gradient} text-white shadow-xl`}
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-black/10 rounded-full blur-3xl" />
        <div className="relative p-8 lg:p-12">
          <div className="flex items-start gap-4 flex-wrap">
            {logoUrl ? (
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center shrink-0 overflow-hidden">
                <img src={logoUrl} alt={brand.name} className="w-12 h-12 object-contain" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/30 flex items-center justify-center shrink-0">
                <Icon className="w-9 h-9" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70 font-semibold">
                {brand.suite}
              </p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <h1 className="text-3xl lg:text-4xl font-bold">{brand.name}</h1>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 ring-1 ring-white/30">
                  {brand.short}
                </span>
              </div>
              <p className="text-white/85 mt-3 max-w-2xl">{brand.tagline}</p>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-4 flex-wrap">
            <Link to={brand.enterPath}>
              <Button className="bg-white text-slate-900 hover:bg-white/90 shadow-lg gap-2">
                {brand.enterLabel} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back to CBD
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">What you can do</h2>
        <p className="text-sm text-slate-500 mb-4">
          A focused workspace within the CBD suite — shared data, distinct experience.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <Card key={i} className="p-5 hover:shadow-md transition-shadow">
              <div
                className={`w-10 h-10 rounded-lg ${brand.softBg} ${brand.softText} flex items-center justify-center mb-3`}
              >
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800">{f.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Suite footer */}
      <div className={`rounded-2xl border ${brand.border} ${brand.softBg} p-5 flex items-center gap-3`}>
        {logoUrl ? (
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-slate-200">
            <img src={logoUrl} alt={brand.name} className="w-7 h-7 object-contain" />
          </div>
        ) : (
          <div className={`w-9 h-9 rounded-lg ${brand.solid} text-white flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <p className={`text-sm font-semibold ${brand.softText}`}>{brand.name} is part of the CBD suite</p>
          <p className="text-xs text-slate-500">
            Shares the same companies, stakeholders, risks, controls and frameworks as the rest of Compliance by Design.
          </p>
        </div>
      </div>
    </div>
  );
}