<?php
// api/admin_cookies.php — Cookies update karo
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'POST chahiye']));
}

$slot = $_POST['slot'] ?? 'C1';
$slot = preg_replace('/[^A-Za-z0-9_-]/', '', $slot);
$cookies_json = $_POST['cookies'] ?? '';

if (empty($cookies_json)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'cookies JSON chahiye']));
}

$test = json_decode($cookies_json, true);
if (!is_array($test)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'JSON format sahi nahi hai']));
}

$hash = md5($cookies_json);

$db = getDB();
$stmt = $db->prepare("INSERT OR REPLACE INTO cookie_slots (slot_name, cookie_data, cookie_hash, updated_at) VALUES (?, ?, ?, datetime('now'))");
$stmt->execute([$slot, $cookies_json, $hash]);

echo json_encode([
    'success' => true,
    'message' => "Slot '$slot' update ho gaya",
    'hash' => $hash,
    'count' => count($test)
]);