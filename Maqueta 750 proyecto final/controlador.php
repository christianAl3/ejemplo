<?php 
$conn = new mysqli('localhost', 'id20691414_chr_database', 'ELtiokuku1%', 'id20691414_christian');
if (isset($_POST['registro'])) {
    if (!empty(trim($_POST['contrasena_usu'])) && !empty(trim($_POST['nombre_usu']))) {
        $contrasena_usu = $_POST['contrasena_usu'];
        $nombre_usu = $_POST['nombre_usu'];

        $enc_contrasena_usu = password_hash($contrasena_usu, PASSWORD_DEFAULT);
        $conn->query("INSERT INTO usuarios(nombre_usu, contrasena_usu) VALUES('$nombre_usu','$contrasena_usu')");

        if ($conn->affected_rows != 1) {
            $registro_error = "Se produjo un error";
        } else {
            $registro_success = "Su información fue registrada correctamente";
        }
    } else {
        $registro_error = "Se requiere llenar los campos";
    }
}

?>