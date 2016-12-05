(function (global) {
    
    "use strict";
    
    // Defines protoype for Object3D container types (Disc, Rod)
    var Object3DProto = {
    
        // Returns an object with the position of the Object3D
        getPosition: function () {
            return {
                x: this.Object3D.position.x,
                y: this.Object3D.position.y,
                z: this.Object3D.position.z
            };
        },
        
        // Sets the position of the Object3D
        setPosition: function (x, y, z) {
            this.Object3D.position.set(x, y, z);
        }

    };
    
    // Function constructor for the Disc type
    function Disc(id, outerRadius, innerRadius, height, texture, color, scene) {
        
        // Creates a geometry for the larger and smaller cylinder
        var largeCylinderGeom = new THREE.CylinderGeometry(outerRadius, outerRadius, height, 64),
            smallCylinderGeom = new THREE.CylinderGeometry(innerRadius, innerRadius, height, 64),
            
            // Converts geometry to BSP which can be used to subtract geometries
            largeCylinderBSP = new ThreeBSP(largeCylinderGeom),
            smallCylinderBSP = new ThreeBSP(smallCylinderGeom),
        
            // Creates a subtraction of two cylinders to form a disc
            intersectionBSP = largeCylinderBSP.subtract(smallCylinderBSP),
            tex = new THREE.TextureLoader().load(texture),
            mat = new THREE.MeshBasicMaterial({ map: tex, color: color });
        
        // Lower ids have a larger radius as they were created first
        this.id = id;
        // Creates the object from the mesh and adds it to the scene
        this.Object3D = intersectionBSP.toMesh(mat);
        scene.add(this.Object3D);
        
    }
    
    // Disc inherits from Object3DProto
    Disc.prototype = Object.create(Object3DProto);
    
    // Tweens the position of the Object3D
    Disc.prototype.tweenPosition = function (x, y, z, callback, time, transition) {
        
        // The default tween time is 1 second
        time = time || 1000;
        // The default transition is an ease out (faster, then slower)
        transition = transition || TWEEN.Easing.Quartic.Out;
        var self = this,
            position = self.getPosition(),
            
            // Creates a new tween to update the position and invokes a callback when it completes
            tween = new TWEEN.Tween(position)
                .to({x: x, y: y, z: z}, time)
                .easing(transition)
                .onUpdate(function () {
                    self.setPosition(position.x, position.y, position.z);
                })
                .onComplete(function () {
                    if (callback) {
                        callback();
                    }
                });
        // Starts the tween
        tween.start();
        
    };
    
    // Function constructor for the Rod type
    function Rod(radius, height, texture, scene, tweenTime) {
        
        // Creates the geometry for a cylinder
        var cylinderGeo = new THREE.CylinderGeometry(radius, radius, height, 64),
            tex = new THREE.TextureLoader().load(texture),
            mat = new THREE.MeshBasicMaterial({ map: tex });
        
        // Creates the object from the mesh and adds it to the scene
        this.Object3D = new THREE.Mesh(cylinderGeo, mat);
        this.height = height;
        this.tweenTime = tweenTime;
        scene.add(this.Object3D);
        
        this.discs = [];
        
    }
    
    // Rod inherits from Object3DProto
    Rod.prototype = Object.create(Object3DProto);
    
    // Tweens a disc from the current rod to the new rod
    Rod.prototype.moveDisc = function (newRod, callback) {
        // if this rod has no discs
        if (this.discs.length === 0) {
            throw "RodHasNoDiscsException";
        }
        var self = this,
            disc = self.discs[this.discs.length - 1];
        // If the new rod's top disc is smaller than this rod's top disc, this is an illegal move
        if (newRod.discs.length > 0 && newRod.discs[newRod.discs.length - 1].id > disc.id) {
            throw "IllegalMoveException";
        }
        // The height that the disc should ends its tween at depends on the number of discs in the new rod
        var finalHeight = (newRod.discs.length + 1) * 20;
        
        // The final tween drops the disc down into the new rod
        function thirdTween() {
            disc.tweenPosition(newRod.Object3D.position.x, finalHeight, disc.getPosition().z, callback, self.tweenTime);
        }
        
        // The second tween moves the disc horizontally to be above the new rod and calls the third tween
        function secondTween() {
            disc.tweenPosition(newRod.Object3D.position.x, self.height + 40, disc.getPosition().z, thirdTween, self.tweenTime);
        }
        
        // The first tween moves the disc up above the current rod and calls the second tween
        function firstTween() {
            disc.tweenPosition(disc.getPosition().x, self.height + 40, disc.getPosition().z, secondTween, self.tweenTime);
        }
        
        // Start the tweening sequence
        firstTween();
        // Move the disc to the correct array
        newRod.discs.push(this.discs.pop());

    };
    
    // Function constructor for the Board type
    function Board(width, height, depth, texture, scene) {
        
        // Creates the geometry for a box
        var boxGeo = new THREE.BoxGeometry(width, height, depth),
        
            tex = new THREE.TextureLoader().load(texture),
            mat = new THREE.MeshBasicMaterial({ map: tex });
        
        // Creates the object from the mesh and adds it to the scene
        this.Object3D = new THREE.Mesh(boxGeo, mat);
        scene.add(this.Object3D);
    }
    
    // Function constructor for the TowersOfHanoi type
    function TowersOfHanoi(numDiscs, scene, tweenTime) {
        
        var self = this,
            rods,
            moveId = 0,
            board;
        
        // Whether we are currently tweening (busy)
        self.tweening = false;
        // Whether we have finished the simulation
        self.finished = false;
        
        // Used as a callback to set tweening to false after completing a tween sequence
        function setTweeningFalse() {
            self.tweening = false;
        }
        
        // Creates the Board, with the size based on the number of discs
        function createBoard() {
            board = new Board((numDiscs + 3) * 120, 20, (numDiscs + 3) * 40, '../img/wood.jpg', scene);
        }
    
        // Creates three Rods, with the height based on the number of discs
        function createRods() {
            rods = [];
            for (var i = 0; i < 3; i++) {
                var height = (numDiscs + 2) * 20;
                var rod = new Rod(20, height, '../img/wood2.jpg', scene, tweenTime);
                rod.setPosition((i - 1) * ((numDiscs + 3) * 40), 10 + height / 2, 0);
                rods.push(rod);
            }
        }

        // Creates the discs, giving them random colours
        function createDiscs() {
            for (var i = 0; i < numDiscs; i++) {
                var disc = new Disc(i + 1, -20 * i + (numDiscs + 2) * 20, 25, 20, '../img/disc.jpg', Math.random() * 0xffffff, scene);
                disc.setPosition(-((numDiscs + 3) * 40), (i + 1) * 20, 0);
                // Add the discs to the initial rod
                rods[0].discs.push(disc);
            }
        }
        
        // Moves a disc between two rods
        function moveBetweenRods(rodA, rodB) {
            // If both rods have no discs
            if (rodA.discs.length + rodB.discs.length === 0) {
                throw "RodHasNoDiscsException";
            }
            // If rod A has no discs, move the disc from B to A
            if (rodA.discs.length === 0) {
                rodB.moveDisc(rodA, setTweeningFalse);
            // If rod B has no discs, move the disc from A to B
            } else if (rodB.discs.length === 0) {
                rodA.moveDisc(rodB, setTweeningFalse);
            } else {
                var rodADisc = rodA.discs[rodA.discs.length - 1],
                    rodBDisc = rodB.discs[rodB.discs.length - 1];
                // If rod B has the larger disc, move the disc from A to B
                if (rodADisc.id > rodBDisc.id) {
                    rodA.moveDisc(rodB, setTweeningFalse);
                // If rod A has the larger disc, move the disc from B to A
                } else {
                    rodB.moveDisc(rodA, setTweeningFalse);
                }
            }
        }
        
        self.setNumDiscs = function(value) {
            numDiscs = value;
            self.reset();
        }
        
        self.setTweenTime = function(value) {
            tweenTime = value;
            for(var i = 0; i < 3; i++) {
                rods[i].tweenTime = tweenTime;
            }
        }
        
        // Do the next move of the Towers of Hanoi puzzle
        self.nextMove = function () {
            // If the simulation already finished
            if (self.finished) {
                throw "NoMoreMovesException";
            }
            // There are three repeated moves in the iterative Towers of Hanoi solution
            switch (moveId) {
                case 0:
                    // The first rod and either the second or third
                    // depending on if there is an even or odd number of discs
                    moveBetweenRods(rods[0], rods[1 + numDiscs % 2]);
                    break;
                case 1:
                    // If we just chose the first and second, now we'll choose
                    // the first and third, and vice versa
                    moveBetweenRods(rods[0], rods[2 - numDiscs % 2]);
                    break;
                case 2:
                    // The second rod and the third rod
                    moveBetweenRods(rods[1], rods[2]);
                    break;
            }
            // set tweening to true so that we don't try to do another move at the same time
            self.tweening = true;
            // increment the move and find the modulous of 3
            moveId = ++moveId % 3;
            // If the last rod has all the discs, we finished
            if(rods[2].discs.length === numDiscs) {
                self.finished = true;
            }
        };
        
        // Reset the simulation by destroying the rods, discs and board and re-create them
        self.reset = function () {
            // Remove all the rods and discs from the scene
            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < rods[i].discs.length; j++) {
                    scene.remove(rods[i].discs[j].Object3D);
                }
                scene.remove(rods[i].Object3D);
            }
            scene.remove(board.Object3D);
            // Recreate everything
            createAll();
            // Start from the first move again
            moveId = 0;
            self.finished = false;
        };
        
        // Create everything
        function createAll() {
            createBoard();
            createRods();
            createDiscs();
        };
        
        createAll();
        
    }
    
    // Expose the TowersOfHanoi object to the global namespace
    global.ToH = TowersOfHanoi;
    
}(window));