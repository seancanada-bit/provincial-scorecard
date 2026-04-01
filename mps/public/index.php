<?php
/**
 * Dynamic meta tags for social sharing.
 * Intercepts requests to /mps/{riding-slug} and injects per-riding OG tags.
 * Normal browsers get the React SPA; social crawlers get rich previews.
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$slug = trim(str_replace('/mps/', '', $uri), '/');

// Only intercept if there's a riding slug
if ($slug && $slug !== 'index.html' && !str_contains($slug, '.')) {
    // Load riding data
    $repoApi = '/home/seanw2/repositories/provincial-scorecard/api/';
    $mpsFile = $repoApi . 'mps.json';
    if (!file_exists($mpsFile)) $mpsFile = $_SERVER['DOCUMENT_ROOT'] . '/api/mps.json';

    $riding = null;
    if (file_exists($mpsFile)) {
        $data = json_decode(file_get_contents($mpsFile), true);
        foreach ($data['ridings'] ?? [] as $r) {
            $rSlug = strtolower(preg_replace('/[^a-z0-9\- ]/i', '', str_replace(['—', '–'], '-', $r['name'])));
            $rSlug = preg_replace('/\s+/', '-', $rSlug);
            $rSlug = preg_replace('/-+/', '-', $rSlug);
            if ($rSlug === $slug || $r['ridingCode'] === $slug) {
                $riding = $r;
                break;
            }
            // Partial match
            if (str_contains($rSlug, $slug)) {
                $riding = $r;
                break;
            }
        }
    }

    if ($riding) {
        $name = htmlspecialchars($riding['name']);
        $mp = htmlspecialchars($riding['mpName'] ?? 'Vacant');
        $party = htmlspecialchars($riding['mpParty'] ?? '');
        $grade = $riding['grade'] ?? '?';
        $score = $riding['composite'] ?? 0;
        $duckGrade = $riding['duckGrade'] ?? '';
        $duckScore = $riding['duckScore'] ?? '';

        $title = "{$name} — {$grade} ({$score}/100) — Bang for Your Duck: MPs";
        $desc = "{$mp} ({$party}) represents {$name}. Performance: {$grade} {$score}/100. Value: {$duckGrade} {$duckScore}/100. See the full breakdown at bangforyourduck.ca";
        $url = "https://bangforyourduck.ca/mps/" . urlencode($slug);
    }
}

// Default meta if no riding matched
if (!isset($title)) {
    $title = "Bang for Your Duck: MPs — What does your MP deliver for your tax loonie?";
    $desc = "Grading all 343 federal electoral ridings on federal investment, transfers, and MP expenses. Free, nonpartisan, independent.";
    $url = "https://bangforyourduck.ca/mps/";
}

// Read the built index.html and inject meta tags
$html = file_get_contents(__DIR__ . '/index.html');
if (!$html) $html = file_get_contents($_SERVER['DOCUMENT_ROOT'] . '/mps/index.html');

// Replace default meta tags with riding-specific ones
$html = preg_replace('/<title>.*?<\/title>/', "<title>{$title}</title>", $html);
$html = preg_replace('/content="Bang for Your Duck: MPs[^"]*"/', 'content="' . $title . '"', $html, 1);
$html = preg_replace('/content="Grading all[^"]*"/', 'content="' . $desc . '"', $html, 1);
$html = preg_replace('/content="https:\/\/bangforyourduck\.ca\/mps[^"]*"/', 'content="' . $url . '"', $html, 1);
$html = preg_replace('/<meta name="description"[^>]*>/', '<meta name="description" content="' . $desc . '" />', $html);

echo $html;
