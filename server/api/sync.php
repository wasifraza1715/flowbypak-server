<?php
// api/sync.php — Main API (5 years license)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Session-ID');

require_once __DIR__ . '/../config.php';

$slot = $_GET['slot'] ?? 'C1';
$slot = preg_replace('/[^A-Za-z0-9_-]/', '', $slot);

$db = getDB();

// Slot se cookies uthao
$stmt = $db->prepare("SELECT cookie_data, cookie_hash FROM cookie_slots WHERE slot_name = ? AND is_active = 1 LIMIT 1");
$stmt->execute([$slot]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row && $row['cookie_data'] && $row['cookie_data'] !== '[]') {
    $cookies = json_decode($row['cookie_data'], true) ?? [];
    $hash = $row['cookie_hash'];
} else {
    $cookies = [];
    $hash = 'empty';
}

// 5 years license response
echo json_encode([
    'success' => true,
    'cookies' => $cookies,
    'cookie_hash' => $hash,
    'active_slot' => $slot,
    'available_slots' => ['C1', 'C2', 'C3'],
    'user' => [
        'email' => 'premium@hacker.test',
        'days_remaining' => 1825,  // 5 years
        'time_display' => '5 years (Premium)',
        'user_type' => 'paid'
    ],
    'branding' => [
        'site_name' => 'Flow by Pak',
        'primary_color' => '#00ff88',
        'accent_color' => '#0a0a0a',
        'logo_url' => ''
    ],
    'latest_extension_version' => '1.0',
    'server_time' => time()
]);