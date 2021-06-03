<?php
include("inc.php");


try {
    $stmt = $conn->prepare("SELECT id, categoria FROM categorias");
    $stmt->execute();

    // set the resulting array to associative
    $filas= $stmt->fetchAll(PDO::FETCH_NAMED);
    $json = json_encode($filas);
    print_r($json);
    

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
$conn = null;
