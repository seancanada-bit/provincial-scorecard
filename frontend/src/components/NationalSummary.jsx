import { useState, useEffect } from 'react';
import { gradeFill } from '../utils/grading.js';

function buildHeadline(national, provinces) {
  if (!national || !provinces) return null;
  const failing = provinces.filter(p => p.composite < 57).length;
  const aGrade  = provinces.filter(p => p.composite >= 80).length;
  if (failing > 0 && aGrade > 0)
    return <>{`Canadian provinces average ${national.avgComposite}/100 overall —`}<br/>{`${aGrade} earning a B or better, ${failing} falling below a passing grade.`}</>;
  if (failing > 0)
    return <>{`Canadian provinces average ${national.avgComposite}/100 —`}<br/>{`with ${failing} province${failing > 1 ? 's' : ''} failing to deliver adequately for residents.`}</>;
  return <>{`Canadian provinces average ${national.avgComposite}/100 overall —`}<br/>{`with healthcare the biggest challenge at ${national.avgHealthcare}/100 nationally.`}</>;
}

export default function NationalSummary({ national, provinces }) {
  if (!national || !provinces) return null;

  const sorted = [...provinces].sort((a, b) => b.composite - a.composite);
  const top = sorted[0];
  const bot = sorted[sorted.length - 1];

  // Find most interesting fiscal story
  const worstFiscal  = [...provinces].sort((a, b) => a.categories.fiscal.score - b.categories.fiscal.score)[0];
  const bestHealth   = [...provinces].sort((a, b) => b.categories.healthcare.score - a.categories.healthcare.score)[0];
  const worstHealth  = [...provinces].sort((a, b) => a.categories.healthcare.score - b.categories.healthcare.score)[0];

  const headline = buildHeadline(national, provinces);

  return (
    <div className="editorial-summary">
      <div className="editorial-summary__inner">
        <p className="editorial-summary__headline">{headline}</p>
        <div className="editorial-summary__callouts">
          <div className="editorial-callout">
            <span className="editorial-callout__label">Best overall</span>
            <span className="editorial-callout__province">{top?.name}</span>
            <span className="editorial-callout__grade" style={{ color: gradeFill(top?.grade) }}>
              {top?.grade} · {top?.composite}/100
            </span>
          </div>
          <div className="editorial-callout editorial-callout--divider" />
          <div className="editorial-callout">
            <span className="editorial-callout__label">Most urgent</span>
            <span className="editorial-callout__province">{bot?.name}</span>
            <span className="editorial-callout__grade" style={{ color: gradeFill(bot?.grade) }}>
              {bot?.grade} · {bot?.composite}/100
            </span>
          </div>
          <div className="editorial-callout editorial-callout--divider" />
          <div className="editorial-callout">
            <span className="editorial-callout__label">Biggest healthcare gap</span>
            <span className="editorial-callout__province">{worstHealth?.name}</span>
            <span className="editorial-callout__grade" style={{ color: gradeFill(worstHealth?.categories?.healthcare?.grade) }}>
              {worstHealth?.categories?.healthcare?.grade} · {worstHealth?.categories?.healthcare?.score}/100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
