<?php
session_start();
?>

<!DOCTYPE html>
<html>
    <head>
        <title>Générateur de parties Marvel Champions</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"></script>
        <link rel="preconnect" href="https://fonts.gstatic.com">
        <link rel="stylesheet" type="text/css" href="style.css">
        <script src="/script.js"></script>
        <script>
            $(document).ready(function() {
                randomPreparation();
                affichage();
                accueil();
                reinitialisation();
            });
        </script>
    </head>

    <body>
        <header class="text-center">
            <h1>MARVEL CHAMPIONS</h1>
            <p>Enfin presque...</p>
        </header>
        <div class="block"></div>
        <section class="title" class="container-fluid">
            <div class="porteimage">
                <img src="../images/autres/Aides de jeu.jpg" alt="Aides de jeu" class="imagedebase">
            </div>
            <div>
                <h3>Si vous voulez qu'un paramètre ne soit pas aléatoire, sélectionnez-le</h3>
            </div>
        </section>


        <?php
        $scenarios=$_SESSION["scenarios"];
        $heros=$_SESSION["heros"];
        $modules=$_SESSION["modules"];
// --------------------------------------------------------------------
        foreach ($_COOKIE as $key=>$val) {
            $x=str_replace("_"," ",urldecode($key));
            foreach ($scenarios as $ligne) {
                $y=explode("#",$ligne)[0];
                if ($x == $y) {
                    if ($val == "false") {
                        unset($scenarios[array_search($ligne, $scenarios)]);
                        $scenarios = array_values($scenarios);
                    }
                }
            }
            foreach ($heros as $ligne) {
                $y=explode("#",$ligne)[0];
                if ($x == $y) {
                    if ($val == "false") {
                        unset($heros[array_search($ligne, $heros)]);
                        $heros = array_values($heros);
                    }
                }
            }
            foreach ($modules as $ligne) {
                $y=explode("#",$ligne)[0];
                if ($x == $y) {
                    if ($val == "false") {
                        unset($modules[array_search($ligne, $modules)]);
                        $modules = array_values($modules);
                    }
                }
            }
        };
// --------------------------------------------------------------------
        $j=$_COOKIE["j"];
        $affinitesa=array_merge(["Aléatoire#images/autres/Aléatoire.png"], $_SESSION["affinites"]);
        $modesa=array_merge(["Aléatoire#images/autres/Aléatoire.png"], $_SESSION["modes"]);
        $scenariosa=array_merge(["Aléatoire#images/autres/Aléatoire.png"], $scenarios);
        $modulesa=array_merge(["Aléatoire#images/autres/Aléatoire.png"], $modules);
        $herosa=array_merge(["Aléatoire#images/autres/Aléatoire.png"], $heros);
        ?>

        <section id="tirage">
            <form method="post">
                <div class="container">
                    <div class="row">
                        <div class="col">
                            </br>
                            <p class="b"><span style="font-size: larger;">Scénario&nbsp;&nbsp;&nbsp;</span>
                            <?php
                                echo('  <select name="choix_scenar" class="dropdown" id="01">');
                                foreach($scenariosa as $ligne){
                                    echo('<option class="willBeRandomized1" value="'.explode("#",$ligne)[1].'">'.explode("#",$ligne)[0].'</option>');
                                };      
                                echo('</select>');
                            ?>
                            </p>
                            <div id="1">
                            </div>
                            <input type="button" value="Générer le scénario" class="randbutton" onclick="randomSolo(1)">
                        </div>
                        <div class="col">
                            <p class="b"><span style="font-size: larger;">Module&nbsp;&nbsp;&nbsp;</span>
                            <?php
                                echo('  <select name="choix_module" class="dropdown" id="02">');
                                foreach($modulesa as $ligne){
                                    echo('<option class="willBeRandomized2" value="'.explode("#",$ligne)[1].'">'.explode("#",$ligne)[0].'</option>');
                                };      
                                echo('</select>');
                            ?>
                            </p>
                            <div id="2">
                            </div>
                            <input type="button" value="Générer le module" class="randbutton" onclick="randomSolo(2)">
                        </div>
                        <div class="col">
                            <p class="b"><span style="font-size: larger;">Difficulté&nbsp;&nbsp;&nbsp;</span>
                            <?php
                                echo('  <select name="choix_mode" class="dropdown" id="03">');
                                foreach($modesa as $ligne){
                                    echo('<option class="willBeRandomized3" value="'.explode("#",$ligne)[1].'">'.explode("#",$ligne)[0].'</option>');
                                };      
                                echo('</select>');
                            ?>
                            </p>
                            <div id="3">
                            </div>
                            <input type="button" value="Générer la difficulté" class="randbutton" onclick="randomSolo(3)">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <p class="b"><span style="font-size: larger;">Héros</span></p>
                        </div>
                    </div>
                    <div class="row">
                    <?php
                    $i=$j;
                    $k=$i+3;
                    while ($i>0) {
                        $w=$i+3;
                        echo('<div class="col">');       
                        echo('<select name="choix_heros" class="dropdown" id="0'.$w.'">');
                        foreach($herosa as $ligne){
                            echo('<option class="willBeRandomized'.$w.'" value="'.explode("#",$ligne)[1].'">'.explode("#",$ligne)[0].'</option>');
                        };      
                        echo('</select>'); 
                        echo('<div id="'.$w.'">');
                        echo("</div>");
                        echo('<input type="button" value="Générer ce héros" class="randbutton" onclick="randomSolo('.$w.')">');
                        echo('</div>');
                        $i=$i-1;
                    };
                    echo('</div>');
                    ?>
                    <div class="row">
                        <div class="col">
                            <p class="b"><span style="font-size: larger;">Affinités</span><br>
                            <span style="font-size: smaller;font-weight:normal">La génération empêche 2 affinités identiques</span></p>
                        </div>
                    </div>
                    <div class="row">
                    <?php
                    while ($j>0) {
                        $z=$j+$k;
                        echo('<div class="col">');       
                        echo('<select name="choix_affinite" class="dropdown" id="0'.$z.'">');
                        foreach($affinitesa as $ligne){
                            echo('<option class="willBeRandomized'.$z.'" value="'.explode("#",$ligne)[1].'">'.explode("#",$ligne)[0].'</option>');
                        };      
                        echo('</select>');
                        echo('<div id="'.$z.'">');
                        echo("</div>");
                        echo('<input type="button" value="Générer cette affinité" class="randbutton" onclick="randomSolo('.$z.')">');    
                        echo('</div>');
                        $j=$j-1;
                    };
                    echo('</div>');
                    ?>
                    <br><br><br>
                </div>
            </form>
        </section>
        <footer>
            <input type="button" value="Générer tout l'Aléatoire" id="randomizer">
            <input type="button" value='Reset' id="redo">
        <script>
            $('.dropdown').change(function() {
                var t=1;
                var x=(2*getCookie("j"))+4;
                while(t<x) {
                    document.getElementById(t).innerHTML='<img src="'+$(document.getElementById("0"+t)).val()+'">';
                    t=t+1;
                }
            });
        </script>
        </footer>
    </body>
</html>







