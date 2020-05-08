<?php
$status = $_GET['status'];
$color = $_GET['color'];
$command = "echo '{\"type\":\"status\",\"status\":\"$status\",\"color\":\"$color\"}'|websocat_arm-linux ws://localhost:8080 -1 -";
$json = shell_exec($command);
echo json_decode($json,true)['value'];
?>
