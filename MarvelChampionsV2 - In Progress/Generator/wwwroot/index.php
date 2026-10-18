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
                preparationscen();
                preparationmodu();
                preparationhero();
                preparationjoueurs();
                preparationlists();
                check();
                accueil();
                cookieChecker();
            });
        </script>
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:title" content="Générateur Marvel Champions" />
        <meta property="og:description" content="Tirez aléatoirement vos héros et le scénario pour des parties différentes." />
        <meta property="og:image" content="facebook_img" />
        <meta property="og:url" content="marvelchampionsgenerator.azurwebsites.net" />
        <meta property="og:site_name" content="Générateur de parties" />
    </head>

    <body>
        <header class="text-center">
            <h1>MARVEL CHAMPIONS</h1>
            <p>Enfin presque...</p>
        </header>
        <div class="block"></div>
        <section class="title" class="container-fluid">
            <div class="porteimage">
                <img src="../images/autres/Docteur Moi.jpg" alt="Docteur Strange" class="imagedebase">
            </div>
            <div>
                <h2>Je suis un générateur hautement qualitatif</h2>
                <h3>Renseignez le matériel que vous possédez</h3>
            </div>
        </section>


                        <?php
                            $scenarios = [];
                            $fileList = glob('images/scenarios/*');
                            foreach($fileList as $filepath){
                                if(is_file($filepath)){
                                    $ext = pathinfo($filepath, PATHINFO_EXTENSION);
                                    $filename = basename($filepath,".".$ext);
                                    array_push($scenarios, $filename."#".$filepath);
                                };  
                            };
                            $_SESSION["scenarios"]=$scenarios;


                            $modules = [];
                            $fileList = glob('images/modules/*');
                            foreach($fileList as $filepath){
                                if(is_file($filepath)){
                                    $ext = pathinfo($filepath, PATHINFO_EXTENSION);
                                    $filename = basename($filepath,".".$ext);
                                    array_push($modules, $filename."#".$filepath);
                                };  
                            };
                            $_SESSION["modules"]=$modules;


                            $modes = [];
                            $fileList = glob('images/modes/*');
                            foreach($fileList as $filepath){
                                if(is_file($filepath)){
                                    $ext = pathinfo($filepath, PATHINFO_EXTENSION);
                                    $filename = basename($filepath,".".$ext);
                                    array_push($modes, $filename."#".$filepath);
                                };  
                            };
                            $_SESSION["modes"]=$modes;


                            $heros = [];
                            $fileList = glob('images/heros/*');
                            foreach($fileList as $filepath){
                                if(is_file($filepath)){
                                    $ext = pathinfo($filepath, PATHINFO_EXTENSION);
                                    $filename = basename($filepath,".".$ext);
                                    array_push($heros, $filename."#".$filepath);
                                };  
                            };
                            $_SESSION["heros"]=$heros;


                            $affinites = [];
                            $fileList = glob('images/affinites/*');
                            foreach($fileList as $filepath){
                                if(is_file($filepath)){
                                    $ext = pathinfo($filepath, PATHINFO_EXTENSION);
                                    $filename = basename($filepath,".".$ext);
                                    array_push($affinites, $filename."#".$filepath);
                                };  
                            };
                            $_SESSION["affinites"]=$affinites;
                        ?> 


        <section id="listes">
            <form method="post">
                <div class="container">
                    <div class="row">
                        <div class="col-sm">
                            <fieldset>
                                <legend><input type="button" class="openHide" value="Vos scénarios  +"></input></legend>  
                                <div class="List">
                                    <label><input type="checkbox" class="allOrNothing" checked><b> Tout (dé)cocher</b></label><br>
                                <?php
                                    foreach($scenarios as $ligne){
                                        echo('<label><input type="checkbox" name="scen" checked value="'.explode("#",$ligne)[0].'" onchange="setCookie(this.value,this.checked)"><b> '.explode("#",$ligne)[0].'</b></label><br>');
                                    };
                                ?>
                                </div>
                            </fieldset>
                        </div>
                        <div class="col-sm">
                            <fieldset>
                                <legend><input type="button" class="openHide" value="Vos modules   +"></input></legend>  
                                <div class="List">
                                    <label><input type="checkbox" class="allOrNothing" checked><b> Tout (dé)cocher</b></label><br>
                                <?php
                                    foreach($modules as $ligne){
                                        echo('<label><input type="checkbox" name="modu" checked value="'.explode("#",$ligne)[0].'" onchange="setCookie(this.value,this.checked)"><b> '.explode("#",$ligne)[0].'</b></label><br>');
                                    };
                                ?>
                                </div>
                            </fieldset>
                        </div>
                        <div class="col-sm">
                        <fieldset>
                                <legend><input type="button" class="openHide" value="Vos héros        +"></input></legend>
                                <div class="List">
                                    <label><input type="checkbox" class="allOrNothing" checked><b> Tout (dé)cocher</b></label><br>
                                <?php
                                    foreach($heros as $ligne){
                                        echo('<label><input type="checkbox" name="hero" checked value="'.explode("#",$ligne)[0].'" onchange="setCookie(this.value,this.checked)"><b> '.explode("#",$ligne)[0].'</b></label><br>');
                                    };
                                ?>
                                </div>
                            </fieldset>
                        </div>
                    </div>
                </div>
            </form>
            <div id="joueurs">
                <label for="players"><b>Joueurs</b></label></br>
                <select name="players" id="players" class="dropdown">
                    <option value="1">1 joueur</option>
                    <option value="2">2 joueurs</option>
                    <option value="3">3 joueurs</option>
                    <option value="4">4 joueurs</option>
                </select>
            </div>
            <button id="isLoop" onclick="isLoop()">J'ai tout bien rempli</button>
        </section>
        <div class="credits">
            Un grand merci à Stéphane Jarny pour son <a href="https://drive.google.com/drive/folders/1ZIDEIVUde8r_cukUIVEclr7lOi2zq_zP?usp=sharing" target="_blank">travail d'illustration</a> des intercalaires repris pour ce site
        </div>           
        <script>
            $('#players').change(function(){
                var joueurs = this.value;
                setCookie("j",joueurs)
            });


            function countByName(name) {
                var checkboxes = document.getElementsByName(name),
                count = 0;
                for (var i=0; i<checkboxes.length; i++) {
                    if (checkboxes[i].type === "checkbox" && checkboxes[i].checked === true){
                        count++;
                    }
                }
                return count
            };


            function isLoop () {
                var joueurs = getCookie("j");
                var heros = countByName("hero");
                var scenarios = countByName("scen");
                var modules = countByName("modu");
                if ((joueurs > heros) || (scenarios < 1) || (modules < 1)) {
                    window.alert("Attention ! Il n'y a pas assez de matériel pour jouer !");
                }
                else {
                    if (joueurs == "") {
                        window.alert("Attention ! Vous n'avez pas sélectionné le nombre de joueurs !")
                    }
                    else {
                        location.href = "majeur.php";
                    }
                }
            };
        </script>
        <div class="cookie-disclaimer">
            <div class="container cookieChecker">
                <p>Ce site utilise des cookies uniquement pour mémoriser votre sélection de matériel</p>
                <button type="button" class="btn btn-success accept-cookie" id="leftCookie">Accepter</button>
                <button type="button" class="btn btn-danger decline-cookie" id="rightCookie">Refuser</button>
            </div>
        </div>    
    </body>
</html>