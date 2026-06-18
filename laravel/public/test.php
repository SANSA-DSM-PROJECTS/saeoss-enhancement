<?php
try {
    $pdo = new PDO("pgsql:host=localhost;dbname=datastore", "alamba", "lamba");
    echo "Connected!";
} catch (PDOException $e) {
    echo $e->getMessage();
}
?>
