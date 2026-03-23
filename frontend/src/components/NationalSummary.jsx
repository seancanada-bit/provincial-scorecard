import { useState, useEffect } from 'react';
import { gradeFillDark } from '../utils/grading.js';

function buildHeadline(national, provinces) {
  if (!national || !provinces) return null;

  const avg     = national.avgComposite;
  const sorted  = [...provinces].sort((a, b) => b.composite - a.composite);
  const top     = sorted[0];
  const bot     = sorted[sorted.length - 1];
  const spread  = top.composite - bot.composite;
  const aboveB  = provinces.filter(p => p.composite >= 73).length;
  const belowC  = provinces.filter(p => p.composite <  60).length;

  // Find the weakest category nationally for a specific data point
  const catAvgs = [
    { label: 'healthcare',        avg: national.avgHealthcare },
    { label: 'housing',           avg: national.avgHousing },
    { label: 'fiscal management', avg: national.avgFiscal },
    { label: 'infrastructure',    avg: national.avgInfrastructure },
    { label: 'the economy',       avg: national.avgEconomy },
    { label: 'education',         avg: national.avgEducation },
    { label: 'public safety',     avg: national.avgSafety },
  ].filter(c => c.avg != null);
  const weakest = [...catAvgs].sort((a, b) => a.avg - b.avg)[0];

  // Some provinces hitting B range, others struggling — show the split
  if (aboveB > 0 && belowC > 0)
    return <>{`Canadian provinces average ${avg}/100 —`}<br/>{`${aboveB} score B or better, ${belowC} score below a C.`}</>;

  // Most struggling — lead with weakest category as the specific finding
  if (belowC >= 7 && weakest)
    return <>{`Canadian provinces average ${avg}/100 —`}<br/>{`${weakest.label} is the biggest gap nationally, averaging just ${weakest.avg}/100.`}</>;

  // Strong scores overall — highlight the spread between best and worst
  if (aboveB >= 3)
    return <>{`Canadian provinces average ${avg}/100 —`}<br/>{`${top.name} leads at ${top.composite}/100, a ${spread}-point gap to ${bot.name}.`}</>;

  // Default — name the leaders without judgment
  return <>{`Canadian provinces average ${avg}/100 —`}<br/>{`${top.name} leads the country, ${bot.name} has the most room to grow.`}</>;
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
            <span className="editorial-callout__grade" style={{ color: gradeFillDark(top?.grade) }}>
              {top?.grade} · {top?.composite}/100
            </span>
          </div>
          <div className="editorial-callout editorial-callout--divider" />
          <div className="editorial-callout">
            <span className="editorial-callout__label">Most urgent</span>
            <span className="editorial-callout__province">{bot?.name}</span>
            <span className="editorial-callout__grade" style={{ color: gradeFillDark(bot?.grade) }}>
              {bot?.grade} · {bot?.composite}/100
            </span>
          </div>
          <div className="editorial-callout editorial-callout--divider" />
          <div className="editorial-callout">
            <span className="editorial-callout__label">Biggest healthcare gap</span>
            <span className="editorial-callout__province">{worstHealth?.name}</span>
            <span className="editorial-callout__grade" style={{ color: gradeFillDark(worstHealth?.categories?.healthcare?.grade) }}>
              {worstHealth?.categories?.healthcare?.grade} · {worstHealth?.categories?.healthcare?.score}/100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
