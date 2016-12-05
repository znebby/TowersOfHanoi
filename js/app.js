(function () {
    
    "use strict";

    var scene, camera, controls, renderer, settings, toh;

    // Run the animation loop and render the scene
    function render() {
        requestAnimationFrame(render);
        TWEEN.update();
        updateTOH();
        renderer.render(scene, camera);
    }
    
    // Default settings
    function Settings() {
        this.numDiscs = 5;
        this.tweenTime = 500;
    }
    
    // Create a settings instance to use for the dat.GUI
    settings = new Settings();
    
    // Initialize the scene
    function init() {

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(0, 500, 500);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Adds the camera controls to allow changing perspective with the mouse
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        
        document.body.appendChild(renderer.domElement);
        toh = new ToH(5, scene, 500);
        window.toh = toh;
    }
    
    // Update the Towers of Hanoi puzzle
    function updateTOH() {
        // If the simulation has not finished and we are not currently tweening
        if (!toh.finished && !toh.tweening) {
            toh.nextMove();
        }
    }
    
    init();
    render(); 

    // If R is pressed, reset the simulation and the camera
    document.addEventListener('keydown', function (event) {
        // 82 is R
        if (event.keyCode === 82) {
            controls.reset();
            toh.reset();
        }
    });
    
    // If the window is resized, redraw the scene
    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Add the gui controls
    window.onload = function () {
        var gui = new dat.GUI();
        // if the number of discs is changed, we must restart
        gui.add(settings, 'numDiscs', 1, 100).step(1)
            .onFinishChange(function (value) {
                toh.setNumDiscs(value);
                controls.reset();
            });
        gui.add(settings, 'tweenTime', 50, 1500).step(50)
            .onFinishChange(function (value) {
                toh.setTweenTime(value);
            });
    };
    
}());