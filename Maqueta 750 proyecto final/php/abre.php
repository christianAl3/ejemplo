<?php
    $conexion= new mysqli('localhost', 'id20691414_chr_database', 'ELtiokuku1%', 'id20691414_christian');
    if($conexion){
        echo "CONEXION EXITOSA";
    }else {
        echo "NO FUNCIONO LA CONEXION";
    }
?>