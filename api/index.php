<?php
/**
 * Bang for Your Duck — Thin API Layer
 * Serves pre-built JSON files with proper headers.
 * No computation — just file reads. Fast.
 */

// CORS (same-origin in production, permissive in dev)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (strpos($origin, 'bangforyourduck.ca') !== false || strpos($origin, 'localhost') !== false) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=3600, must-revalidate');

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// JSON source: try repo directory first (always fresh after git pull), fall back to local copy
$repoApi = '/home/seanw2/repositories/provincial-scorecard/api/';
$localApi = __DIR__ . '/';
function jsonPath($name) {
    global $repoApi, $localApi;
    $repo = $repoApi . $name;
    return file_exists($repo) ? $repo : $localApi . $name;
}

// Route
if (preg_match('#/api/data#', $uri)) {
    readfile(jsonPath('data.json'));
} elseif (preg_match('#/api/cities#', $uri)) {
    readfile(jsonPath('cities.json'));
} elseif (preg_match('#/api/mps#', $uri)) {
    readfile(jsonPath('mps.json'));
} elseif (preg_match('#/api/health#', $uri)) {
    echo json_encode(['ok' => true, 'generated' => filemtime(__DIR__ . '/data.json') ?: null]);
} elseif (preg_match('#/api/event#', $uri)) {
    // Event tracking — delegate to event.php
    require __DIR__ . '/event.php';
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
