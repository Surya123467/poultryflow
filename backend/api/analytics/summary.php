<?php
declare(strict_types=1);
require_once __DIR__ . '/../../config/database.php';
if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendJsonResponse(['success' => false, 'message' => 'Method not allowed. Use GET.'], 405);
$batchId = filter_var($_GET['batch_id'] ?? null, FILTER_VALIDATE_INT);
if ($batchId === false || $batchId <= 0) sendJsonResponse(['success' => false, 'message' => 'A valid batch_id query parameter is required.'], 422);
try {
    $stmt = $pdo->prepare('SELECT id, batch_name, initial_birds, start_date FROM batches WHERE id = :id');
    $stmt->execute([':id' => $batchId]);
    $batch = $stmt->fetch();
    if (!$batch) sendJsonResponse(['success' => false, 'message' => 'Batch not found.'], 404);
    $stmt = $pdo->prepare('SELECT COUNT(*) log_days, COALESCE(SUM(feed_consumed_kg),0) feed, COALESCE(SUM(water_consumed_liters),0) water, COALESCE(SUM(mortality),0) mortality, COALESCE(SUM(eggs_collected),0) eggs FROM daily_logs WHERE batch_id = :id');
    $stmt->execute([':id' => $batchId]);
    $totals = $stmt->fetch();
    $stmt = $pdo->prepare('SELECT log_date, feed_consumed_kg, water_consumed_liters, mortality, eggs_collected FROM daily_logs WHERE batch_id = :id ORDER BY log_date ASC');
    $stmt->execute([':id' => $batchId]);
    $trends = $stmt->fetchAll();
    foreach ($trends as &$trend) { $trend['feed_consumed_kg']=(float)$trend['feed_consumed_kg']; $trend['water_consumed_liters']=(float)$trend['water_consumed_liters']; $trend['mortality']=(int)$trend['mortality']; $trend['eggs_collected']=(int)$trend['eggs_collected']; }
    unset($trend);
    $initial=(int)$batch['initial_birds']; $mortality=(int)$totals['mortality']; $feed=(float)$totals['feed']; $eggs=(int)$totals['eggs'];
    sendJsonResponse(['success'=>true,'data'=>[
        'batch'=>['id'=>(int)$batch['id'],'batch_name'=>$batch['batch_name'],'start_date'=>$batch['start_date'],'initial_birds'=>$initial],
        'performance'=>['current_live_birds'=>max(0,$initial-$mortality),'total_mortality'=>$mortality,'mortality_rate_percent'=>round(($mortality/$initial)*100,2),'feed_conversion_ratio'=>$eggs>0?round($feed/$eggs,4):null],
        'totals'=>['log_days'=>(int)$totals['log_days'],'feed_consumed_kg'=>round($feed,2),'water_consumed_liters'=>round((float)$totals['water'],2),'eggs_collected'=>$eggs],
        'trends'=>$trends
    ]]);
} catch (PDOException $exception) { error_log($exception->getMessage()); sendJsonResponse(['success'=>false,'message'=>'Unable to calculate analytics summary.'],500); }
