<?php
/**
 * Postal code → riding/province/city lookup.
 * Uses the free Represent API (represent.opennorth.ca) to resolve a Canadian
 * postal code to a federal electoral district, then matches against our scored
 * data to return a combined province + city + MP scorecard.
 *
 * GET /api/lookup?pc=K1A0A6
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=3600');

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (strpos($origin, 'nonpartisangovernance.ca') !== false || strpos($origin, 'localhost') !== false) {
    header("Access-Control-Allow-Origin: $origin");
}

// ─── Input ──────────────────────────────────────────────────────────────────
$raw = strtoupper(trim($_GET['pc'] ?? ''));
$pc  = preg_replace('/[^A-Z0-9]/', '', $raw);

if (!$pc || !preg_match('/^[A-Z]\d[A-Z]\d[A-Z]\d$/', $pc)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid postal code. Use format: A1A1A1']);
    exit;
}

// ─── Call Represent API ─────────────────────────────────────────────────────
$representUrl = "https://represent.opennorth.ca/postcodes/{$pc}/";
$ctx = stream_context_create([
    'http' => [
        'timeout' => 8,
        'user_agent' => 'NonpartisanGovernanceLedger/1.0',
        'header' => "Accept: application/json\r\n",
    ],
]);

$json = @file_get_contents($representUrl, false, $ctx);
if ($json === false) {
    http_response_code(502);
    echo json_encode(['error' => 'Could not reach postal code lookup service. Try again.']);
    exit;
}

$geo = json_decode($json, true);
if (!$geo || !isset($geo['boundaries_centroid'])) {
    http_response_code(404);
    echo json_encode(['error' => 'Postal code not found.']);
    exit;
}

// ─── Extract federal riding ─────────────────────────────────────────────────
$ridingName = null;
$seen = [];
foreach ($geo['boundaries_centroid'] as $b) {
    if (($b['boundary_set_name'] ?? '') === 'Federal electoral district' && !isset($seen[$b['name']])) {
        $ridingName = $b['name'];
        $seen[$b['name']] = true;
        break;
    }
}
// Fallback to concordance
if (!$ridingName) {
    foreach ($geo['boundaries_concordance'] ?? [] as $b) {
        if (($b['boundary_set_name'] ?? '') === 'Federal electoral district') {
            $ridingName = $b['name'];
            break;
        }
    }
}

$city     = $geo['city'] ?? null;
$province = $geo['province'] ?? null;

// Province code mapping
$provCodes = [
    'AB' => 'AB', 'BC' => 'BC', 'SK' => 'SK', 'MB' => 'MB',
    'ON' => 'ON', 'QC' => 'QC', 'NB' => 'NB', 'NS' => 'NS',
    'PE' => 'PE', 'NL' => 'NL', 'YT' => 'YT', 'NT' => 'NT', 'NU' => 'NU',
];
$provCode = $provCodes[$province] ?? null;

// ─── Load our scored data ───────────────────────────────────────────────────
// Use the same jsonPath logic as index.php: prefer git repo, fall back to local
$repoApi = '/home/seanw2/repositories/provincial-scorecard/api/';
$localApi = __DIR__ . '/';

function jp($name) {
    global $repoApi, $localApi;
    $repo = $repoApi . $name;
    return file_exists($repo) ? $repo : $localApi . $name;
}

$provinces = json_decode(file_get_contents(jp('data.json')), true);
$cities    = json_decode(file_get_contents(jp('cities.json')), true);
$mps       = json_decode(file_get_contents(jp('mps.json')), true);

// ─── Match province ─────────────────────────────────────────────────────────
$matchedProvince = null;
if ($provCode && $provinces) {
    foreach ($provinces['provinces'] ?? [] as $p) {
        if (($p['code'] ?? '') === $provCode) {
            $matchedProvince = [
                'name'       => $p['name'],
                'code'       => $p['code'],
                'grade'      => $p['grade'],
                'composite'  => $p['composite'],
                'valueScore' => $p['valueScore'] ?? null,
                'valueGrade' => gradeFromScore($p['valueScore'] ?? null),
                'premier'    => $p['premierName'] ?? null,
                'url'        => '/provinces/',
            ];
            break;
        }
    }
}

// ─── Match city (CMA) ───────────────────────────────────────────────────────
$matchedCity = null;
if ($city && $cities) {
    $cityUpper = strtoupper($city);
    // Try exact match first, then prefix match
    foreach ($cities['cities'] ?? [] as $c) {
        $cName = strtoupper($c['name'] ?? '');
        if ($cName === $cityUpper || strpos($cName, $cityUpper) === 0) {
            $matchedCity = [
                'name'       => $c['name'],
                'province'   => $c['provinceAbbr'] ?? $c['province'] ?? '',
                'grade'      => $c['grade'],
                'composite'  => $c['composite'],
                'valueScore' => $c['duckScore'] ?? null,
                'valueGrade' => gradeFromScore($c['duckScore'] ?? null),
                'mayor'      => $c['mayorName'] ?? null,
                'url'        => '/cities/',
            ];
            break;
        }
    }
    // Fuzzy: try matching first word
    if (!$matchedCity) {
        $firstWord = explode(' ', $cityUpper)[0];
        if (strlen($firstWord) >= 4) {
            foreach ($cities['cities'] ?? [] as $c) {
                if (stripos($c['name'] ?? '', $firstWord) === 0) {
                    $matchedCity = [
                        'name'       => $c['name'],
                        'province'   => $c['provinceAbbr'] ?? $c['province'] ?? '',
                        'grade'      => $c['grade'],
                        'composite'  => $c['composite'],
                        'valueScore' => $c['duckScore'] ?? null,
                        'valueGrade' => gradeFromScore($c['duckScore'] ?? null),
                        'mayor'      => $c['mayorName'] ?? null,
                        'url'        => '/cities/',
                    ];
                    break;
                }
            }
        }
    }
}

// ─── Match riding/MP ────────────────────────────────────────────────────────
$matchedRiding = null;
if ($ridingName && $mps) {
    // Normalize dashes: the API uses en-dash (–) and em-dash (—) inconsistently
    $normalizedRiding = str_replace(['–', '—', "\u{2013}", "\u{2014}"], '—', $ridingName);

    foreach ($mps['ridings'] ?? [] as $r) {
        $rName = str_replace(['–', '—', "\u{2013}", "\u{2014}"], '—', $r['name'] ?? '');
        if (strcasecmp($rName, $normalizedRiding) === 0) {
            $matchedRiding = [
                'name'       => $r['name'],
                'mpName'     => $r['mpName'],
                'party'      => $r['mpParty'] ?? null,
                'province'   => $r['province'],
                'grade'      => $r['grade'],
                'composite'  => $r['composite'],
                'valueScore' => $r['duckScore'] ?? null,
                'valueGrade' => gradeFromScore($r['duckScore'] ?? null),
                'mpWork'     => $r['categories']['performance']['score'] ?? null,
                'url'        => '/mps/',
            ];
            break;
        }
    }

    // Fuzzy fallback: match first segment before dash
    if (!$matchedRiding) {
        $prefix = explode('—', $normalizedRiding)[0];
        $prefix = explode('–', $prefix)[0];
        $prefix = trim($prefix);
        foreach ($mps['ridings'] ?? [] as $r) {
            if ($provCode && ($r['province'] ?? '') !== $provCode) continue;
            if (stripos($r['name'] ?? '', $prefix) === 0) {
                $matchedRiding = [
                    'name'       => $r['name'],
                    'mpName'     => $r['mpName'],
                    'party'      => $r['mpParty'] ?? null,
                    'province'   => $r['province'],
                    'grade'      => $r['grade'],
                    'composite'  => $r['composite'],
                    'valueScore' => $r['duckScore'] ?? null,
                    'valueGrade' => gradeFromScore($r['duckScore'] ?? null),
                    'mpWork'     => $r['categories']['performance']['score'] ?? null,
                    'url'        => '/mps/',
                ];
                break;
            }
        }
    }
}

// ─── Response ───────────────────────────────────────────────────────────────
echo json_encode([
    'postalCode' => substr($pc, 0, 3) . ' ' . substr($pc, 3),
    'city'       => $city ? ucwords(strtolower($city)) : null,
    'province'   => $matchedProvince,
    'riding'     => $matchedRiding,
    'municipal'  => $matchedCity,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

// ─── Helpers ────────────────────────────────────────────────────────────────
function gradeFromScore($score) {
    if ($score === null) return null;
    if ($score >= 93) return 'A+';
    if ($score >= 87) return 'A';
    if ($score >= 80) return 'A-';
    if ($score >= 77) return 'B+';
    if ($score >= 73) return 'B';
    if ($score >= 70) return 'B-';
    if ($score >= 67) return 'C+';
    if ($score >= 60) return 'C';
    if ($score >= 57) return 'C-';
    if ($score >= 40) return 'D';
    return 'F';
}
