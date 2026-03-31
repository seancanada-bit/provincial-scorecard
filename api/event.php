<?php
/**
 * Event tracking endpoint — POST /api/event
 * Writes to MySQL events table. Fire-and-forget from frontend.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['ok' => false]);
    exit;
}

// Always respond immediately
echo json_encode(['ok' => true]);

// Flush response so browser doesn't wait
if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();

// Parse body
$body = json_decode(file_get_contents('php://input'), true);
if (!$body || empty($body['event'])) exit;

$valid_events = ['province_expanded', 'tab_viewed', 'sort_changed', 'methodology_opened', 'city_select', 'city_tab', 'riding_select', 'riding_tab'];
if (!in_array($body['event'], $valid_events)) exit;

// Insert into MySQL
try {
    $config = require __DIR__ . '/db-config.php';
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset=utf8mb4",
        $config['user'],
        $config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->prepare('INSERT INTO events (event, province, detail, referrer, device) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([
        $body['event'],
        $body['province'] ?? null,
        $body['detail'] ?? null,
        $body['referrer'] ?? null,
        $body['device'] ?? null,
    ]);
} catch (Exception $e) {
    // Silently fail — tracking must never surface errors
    error_log('Event tracking error: ' . $e->getMessage());
}
