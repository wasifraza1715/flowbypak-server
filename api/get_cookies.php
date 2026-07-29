<?php
// api/get_cookies.php — Admin panel (browser mein open karo)
require_once __DIR__ . '/../config.php';
$db = getDB();

$msg = '';

// Jab form submit ho
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['cookies_json'])) {
    $slot = $_POST['slot_name'] ?? 'C1';
    $slot = preg_replace('/[^A-Za-z0-9_-]/', '', $slot);
    $cj = $_POST['cookies_json'];
    $test = json_decode($cj, true);
    if (is_array($test)) {
        $hash = md5($cj);
        $stmt = $db->prepare("INSERT OR REPLACE INTO cookie_slots (slot_name, cookie_data, cookie_hash, updated_at) VALUES (?, ?, ?, datetime('now'))");
        $stmt->execute([$slot, $cj, $hash]);
        $msg = "✅ Slot '$slot' update ho gaya - " . count($test) . " cookies save hui";
    } else {
        $msg = "❌ JSON format sahi nahi hai. Array of objects chahiye.";
    }
}

// Saare slots dikhao
$slots = $db->query("SELECT * FROM cookie_slots ORDER BY slot_name")->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Flow by Pak — Cookie Admin</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0a;color:#e0e0e0;font-family:Tahoma,sans-serif;padding:20px;max-width:900px;margin:auto}
h1{color:#00ff88;font-size:22px;margin-bottom:5px}
h2{color:#ccc;font-size:16px;margin:20px 0 10px}
p{color:#888;font-size:13px;margin-bottom:14px}
.slot-card{background:#161616;border:1px solid #2a2a2a;border-radius:8px;padding:15px;margin-bottom:12px}
.slot-card .name{color:#00ff88;font-weight:bold;font-size:14px}
.slot-card .info{color:#888;font-size:12px;margin:4px 0}
.slot-card pre{background:#111;border-radius:4px;padding:8px;font-size:11px;color:#aaa;max-height:120px;overflow:auto;margin-top:6px}
textarea{width:100%;height:180px;background:#111;border:1px solid #333;border-radius:6px;color:#fff;padding:10px;font-family:monospace;font-size:12px;margin-top:4px}
select,input{padding:8px 12px;background:#111;border:1px solid #333;border-radius:6px;color:#fff;font-size:13px;margin:4px 0}
.submit-btn{background:#00ff88;color:#000;font-weight:bold;padding:10px 25px;border:none;border-radius:6px;cursor:pointer;font-size:14px;margin-top:8px}
.submit-btn:hover{background:#00cc6a}
.msg{background:#112211;border:1px solid #00ff8844;border-radius:6px;padding:10px;margin:10px 0;color:#00ff88;font-size:13px}
.instructions{background:#111122;border:1px solid #4488ff44;border-radius:8px;padding:15px;margin:15px 0}
.instructions h3{color:#4488ff;font-size:14px;margin-bottom:8px}
.instructions li{color:#aaa;font-size:13px;margin:6px 0;padding-left:10px}
code{background:#222;color:#00ff88;padding:2px 6px;border-radius:3px;font-size:12px}
hr{border:none;border-top:1px solid #1a1a1a;margin:14px 0}
</style>
</head>
<body>

<h1>🔐 Flow by Pak — Cookie Admin</h1>
<p>Apne Google session cookies yahan daalein. Extension inhe inject karega.</p>

<div class="instructions">
<h3>📖 Google Cookies Kaise Nikalein</h3>
<ol>
<li>Chrome mein <b>labs.google.com</b> kholo aur login karo</li>
<li>F12 dabaao → <b>Console</b> tab mein jao</li>
<li>Yeh code copy karo aur Console mein paste karo, Enter dabaao:</li>
<code style="display:block;margin:8px 0;padding:10px;background:#000">
(async () => {<br>
&nbsp; const c = document.cookie.split('; ').map(x => {<br>
&nbsp;&nbsp;&nbsp; const [n,...v] = x.split('=');<br>
&nbsp;&nbsp;&nbsp; return {name:decodeURIComponent(n), value:decodeURIComponent(v.join('=')), domain:location.hostname, path:'/', secure:true, httpOnly:false, sameSite:'lax'};<br>
&nbsp; });<br>
&nbsp; await navigator.clipboard.writeText(JSON.stringify(c, null, 2));<br>
&nbsp; alert('✅ Cookies copy ho gayi! Admin panel mein paste karo.');<br>
})();
</code>
<li>Ab <b>Neeche bade box mein</b> paste karo (Ctrl+V)</li>
<li><b>"Save Cookies"</b> dabaao → Done! ✅</li>
</ol>
</div>

<?php if ($msg): ?><div class="msg"><?=htmlspecialchars($msg)?></div><?php endif; ?>

<h2>📋 Current Cookie Slots</h2>
<?php foreach ($slots as $s): ?>
<div class="slot-card">
  <div class="name">■ Slot: <?=htmlspecialchars($s['slot_name'])?></div>
  <div class="info">Hash: <?=htmlspecialchars($s['cookie_hash'])?> · Active: <?=$s['is_active']?'✅ Yes':'❌ No'?> · Updated: <?=$s['updated_at']?></div>
  <pre><?php
    $data = json_decode($s['cookie_data'], true);
    if ($data && count($data) > 0) {
        echo htmlspecialchars(json_encode($data, JSON_PRETTY_PRINT));
    } else {
        echo "(khali — abhi koi cookies nahi hain)";
    }
  ?></pre>
</div>
<?php endforeach; ?>

<hr>

<h2>📝 Cookies Yahan Update Karo</h2>
<form method="POST">
  <label style="display:block;margin:6px 0;font-size:13px;color:#888">
    Slot:
    <select name="slot_name" style="margin-left:8px">
      <option value="C1">C1</option>
      <option value="C2">C2</option>
      <option value="C3">C3</option>
    </select>
  </label>
  <label style="display:block;margin:6px 0;font-size:13px;color:#888">
    Cookies JSON (yahan paste karo):
  </label>
  <textarea name="cookies_json" placeholder='[{"name":"__Secure-3PSID","value":"xyz...","domain":".google.com","path":"/","secure":true}]'></textarea>
  <br>
  <input type="submit" value="💾 Save Cookies" class="submit-btn">
</form>

<hr>

<h2>🔧 Quick Test</h2>
<p style="font-size:12px">
  API test: <code><?='https://'.$_SERVER['HTTP_HOST']?>/api/sync.php</code>
  <br>Browser mein yeh URL kholo — agar JSON dikhe toh server kaam kar raha hai ✅
</p>

</body>
</html>