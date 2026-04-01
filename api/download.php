<?php
/**
 * PDF Report Download Proxy
 * Serves PDFs from a non-public directory. No direct file access.
 *
 * Usage: /api/download?riding=59019
 *
 * Future: add Stripe payment check, rate limiting, auth tokens
 */

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (strpos($origin, 'bangforyourduck.ca') !== false || strpos($origin, 'localhost') !== false) {
    header("Access-Control-Allow-Origin: $origin");
}

// PDF storage — use document root to find reports directory
define('REPORTS_DIR', $_SERVER['DOCUMENT_ROOT'] . '/reports/ridings/');

$ridingCode = $_GET['riding'] ?? '';

// Validate: must be 5 digits
if (!preg_match('/^\d{5}$/', $ridingCode)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid riding code']);
    exit;
}

// Find the PDF file (riding code is the prefix)
$files = glob(REPORTS_DIR . $ridingCode . '-*.pdf');
if (empty($files)) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Report not found for riding ' . $ridingCode]);
    exit;
}

$filePath = $files[0];
$fileName = basename($filePath);

// Rate limiting (simple: max 20 downloads per IP per hour)
$rateLimitDir = sys_get_temp_dir() . '/bfyd-ratelimit/';
if (!is_dir($rateLimitDir)) mkdir($rateLimitDir, 0755, true);
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateLimitFile = $rateLimitDir . md5($ip) . '.txt';
$now = time();
$window = 3600; // 1 hour
$maxRequests = 20;

$requests = [];
if (file_exists($rateLimitFile)) {
    $requests = array_filter(
        explode("\n", file_get_contents($rateLimitFile)),
        fn($ts) => $ts && ($now - intval($ts)) < $window
    );
}

if (count($requests) >= $maxRequests) {
    http_response_code(429);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Too many downloads. Try again in an hour.']);
    exit;
}

$requests[] = $now;
file_put_contents($rateLimitFile, implode("\n", $requests));

// Serve the PDF
header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="' . $fileName . '"');
header('Content-Length: ' . filesize($filePath));
header('Cache-Control: private, max-age=86400');
header('X-Content-Type-Options: nosniff');

readfile($filePath);
