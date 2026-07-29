<?php
// config.php - SQLite Version (No MySQL needed!)
// Ye automatically SQLite database create karega

define('DB_PATH', __DIR__ . '/data/flowbypak.db');

function getDB() {
    static $db = null;
    if ($db === null) {
        // data folder banao agar nahi hai
        $dir = dirname(DB_PATH);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        $db = new PDO("sqlite:" . DB_PATH);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Pehli baar teb banao
        $db->exec("CREATE TABLE IF NOT EXISTS cookie_slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slot_name TEXT NOT NULL UNIQUE DEFAULT 'C1',
            cookie_data TEXT DEFAULT '[]',
            cookie_hash TEXT DEFAULT '',
            is_active INTEGER DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Default slots banao agar nahi hain
        $stmt = $db->query("SELECT COUNT(*) FROM cookie_slots");
        if ($stmt->fetchColumn() == 0) {
            $db->exec("INSERT INTO cookie_slots (slot_name, cookie_data, cookie_hash) VALUES ('C1', '[]', 'empty')");
            $db->exec("INSERT INTO cookie_slots (slot_name, cookie_data, cookie_hash) VALUES ('C2', '[]', 'empty')");
            $db->exec("INSERT INTO cookie_slots (slot_name, cookie_data, cookie_hash) VALUES ('C3', '[]', 'empty')");
        }
    }
    return $db;
}