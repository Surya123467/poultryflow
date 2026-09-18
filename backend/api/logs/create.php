<?php
declare(strict_types=1);
require_once __DIR__ . '/../../config/database.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendJsonResponse(['success' => false, 'message' => 'Method not allowed. Use POST.'], 405);
$data = readJsonBody();
$batchId = filter_var($data['batch_id'] ?? null, FILTER_VALIDATE_INT);
$logDate = trim((string)($data['log_date'] ?? ''));
$feed = filter_var($data['feed_consumed_kg'] ?? null, FILTER_VALIDATE_FLOAT);
$water = filter_var($data['water_consumed_liters'] ?? null, FILTER_VALIDATE_FLOAT);
$mortality = filter_var($data['mortality'] ?? null, FILTER_VALIDATE_INT);
$eggs = filter_var($data['eggs_collected'] ?? null, FILTER_VALIDATE_INT);
if ($batchId === false || $batchId <= 0) sendJsonResponse(['success' => false, 'message' => 'A valid batch ID is required.'], 422);
if (!validDate($logDate)) sendJsonResponse(['success' => false, 'message' => 'Log date must use YYYY-MM-DD format.'], 422);
if ($feed === false || $feed < 0) sendJsonResponse(['success' => false, 'message' => 'Feed consumed must be zero or greater.'], 422);
if ($water === false || $water < 0) sendJsonResponse(['success' => false, 'message' => 'Water consumed must be zero or greater.'], 422);
if ($mortality === false || $mortality < 0) sendJsonResponse(['success' => false, 'message' => 'Mortality must be zero or greater.'], 422);
if ($eggs === false || $eggs < 0) sendJsonResponse(['success' => false, 'message' => 'Eggs collected must be zero or greater.'], 422);
try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT initial_birds FROM batches WHERE id = :id FOR UPDATE');
    $stmt->execute([':id' => $batchId]);
    $batch = $stmt->fetch();
    if (!$batch) { $pdo->rollBack(); sendJsonResponse(['success' => false, 'message' => 'The selected batch does not exist.'], 404); }
    $stmt = $pdo->prepare('SELECT COALESCE(SUM(mortality), 0) AS total FROM daily_logs WHERE batch_id = :id');
    $stmt->execute([':id' => $batchId]);
    $remaining = (int)$batch['initial_birds'] - (int)$stmt->fetch()['total'];
    if ($mortality > $remaining) { $pdo->rollBack(); sendJsonResponse(['success' => false, 'message' => 'Mortality cannot exceed the number of currently live birds.'], 422); }
    $stmt = $pdo->prepare('INSERT INTO daily_logs (batch_id, log_date, feed_consumed_kg, water_consumed_liters, mortality, eggs_collected) VALUES (:batch, :date, :feed, :water, :mortality, :eggs)');
    $stmt->execute([':batch' => $batchId, ':date' => $logDate, ':feed' => $feed, ':water' => $water, ':mortality' => $mortality, ':eggs' => $eggs]);
    $id = (int)$pdo->lastInsertId();
    $pdo->commit();
    sendJsonResponse(['success' => true, 'message' => 'Daily farm log saved successfully.', 'data' => ['id' => $id]], 201);
} catch (PDOException $exception) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log($exception->getMessage());
    if ($exception->getCode() === '23000') sendJsonResponse(['success' => false, 'message' => 'A daily log already exists for this batch and date.'], 409);
    sendJsonResponse(['success' => false, 'message' => 'Unable to save the daily farm log.'], 500);
}
