$(function () {
    var doc = $(document), win = $(window);

    var scene, camera, renderer;
    var axis;
    var planeGeometry;
    var planeMaterial;
    var plane;
    var spotLight;
    var stats;
    var SCREEN_WIDTH = window.innerWidth;
    var SCREEN_HEIGHT = window.innerHeight;
    var projector;
    var mouse = {x: 0, y: 0, clicked: false};
    var container = $("#webglcontainer");
    var ray;
    var objects = new Array();

    /*creates empty scene object and renderer*/
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, SCREEN_WIDTH / SCREEN_HEIGHT, .1, 500);
    renderer = new THREE.WebGLRenderer({antialias: true});

    renderer.setClearColor(0xdddddd);
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;

    projector = new THREE.Projector();

    /*add controls*/
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', render);

    /*adds helpers*/
    axis = new THREE.AxisHelper(10);
    scene.add(axis);

    /*create plane*/
    planeGeometry = new THREE.PlaneGeometry(100, 100, 100);
    planeMaterial = new THREE.MeshPhongMaterial({color: 0xffffff});
    plane = new THREE.Mesh(planeGeometry, planeMaterial);

    /*position and add objects to scene*/
    plane.rotation.x = -.5 * Math.PI;
    plane.receiveShadow = true;
    scene.add(plane);

    camera.position.x = 50;
    camera.position.y = 50;
    camera.position.z = 50;
    camera.lookAt(scene.position);

    var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    ray = new THREE.Raycaster(camera.position,
        vector.sub(camera.position).normalize());

    /*adds spot light with starting parameters*/
    spotLight = new THREE.SpotLight(0xffffff);
    spotLight.castShadow = true;
    spotLight.position.set(20, 35, 40);
    spotLight.intensity = 1;
    spotLight.distance = 0;
    spotLight.angle = 1.570;
    spotLight.exponent = 0;
    spotLight.shadowCameraNear = 10;
    spotLight.shadowCameraFar = 100;
    spotLight.shadowCameraFov = 50;
    spotLight.shadowCameraVisible = false;
    spotLight.shadowBias = 0;
    spotLight.shadowDarkness = 0.5;
    scene.add(spotLight);

    container.append(renderer.domElement);
    /*stats*/
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    container.append(stats.domElement);

    function render() {

    }

    function animate() {
        requestAnimationFrame(animate);
        render();
        stats.update();
        updateControls();
        renderer.render(scene, camera);
    }

    function updateControls() {
        var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(camera);
        ray = new THREE.Raycaster(camera.position,
            vector.sub(camera.position).normalize());

        if (mouse.clicked) {
            mouse.clicked = false;
            ray.setFromCamera(mouse, camera);
            var intersects = ray.intersectObjects(objects);
            if (intersects.length > 0) {
                OrbitControlMouseUp();
                // controls.noRotate = true;
                selectTool(intersects[0].object).done(function(tool) {
                    var key = Object.keys(tool);
                    var val = tool[key].name;
                    $('select.tool').append('<option value="' + key + '">' + val + '</option>');
                });
                $('#operationModal').css('display', 'block');
                $('.operationModal-bg').fadeIn().find('input');
                doc.trigger('openModal');
            }
        }
    }

    doc.on('mousemove', onDocumentMouseMove);
    doc.on('mousedown', onDocumentMouseDown);

    function onDocumentMouseMove(event) {
        mouse.x = (event.clientX / SCREEN_WIDTH) * 2 - 1;
        mouse.y = -(event.clientY / SCREEN_HEIGHT) * 2 + 1;
    }

    function onDocumentMouseDown(event) {
        mouse.x = ( event.clientX / SCREEN_WIDTH ) * 2 - 1;
        mouse.y = -( event.clientY / SCREEN_HEIGHT ) * 2 + 1;
        mouse.clicked = true;
        // controls.noRotate = false;
    }

    function selectTool(clickedObject){
        var tool = [];
        var material = clickedObject.materialName;
        var dfd = $.Deferred();
        $.ajax({
            url: '/tools',
            dataType: 'json',
            type: 'GET',
            success: function(data) {
                for (var key in data) {
                    if (!data.hasOwnProperty(key)) continue;

                    var obj = data[key];
                    for (var prop in obj) {
                        if(!obj.hasOwnProperty(prop)) continue;

                        if(prop === material){
                            tool[prop] = obj[prop];
                        }
                    }
                }
                //tool = data[0][material];
                dfd.resolve(tool);
            }
        });

        return dfd.promise();
    }

    function performOperation(depthOfCut, feedLength) {
        var clickedObject;
        if (objects.length > 1) {
            if (parseInt(feedLength) > parseInt(objects[objects.length - 1].geometry.parameters.height)) {
                clickedObject = objects[objects.length - 2];
            } else {
                clickedObject = objects[objects.length - 1];
            }
        } else {
            clickedObject = objects[0];
        }

        var oldParams = clickedObject.geometry.parameters;
        scene.remove(clickedObject);

        var cylinderOne = createNewGeometry(parseInt(oldParams.radiusBottom), parseInt(oldParams.radiusTop), oldParams.height - feedLength);

        var cylinderTwo = createNewGeometry(parseInt(clickedObject.position.y - depthOfCut), parseInt(clickedObject.position.y - depthOfCut), feedLength);
        scene.add(cylinderOne);
        scene.add(cylinderTwo);

        cylinderOne.position.x = parseFloat(clickedObject.position.x) - parseFloat(cylinderOne.geometry.parameters.height / 2);
        cylinderOne.position.y = parseFloat(clickedObject.position.y);
        cylinderOne.position.z = parseFloat(clickedObject.position.z);

        cylinderTwo.position.x = parseFloat(cylinderOne.position.x) + parseFloat(cylinderTwo.geometry.parameters.height);
        cylinderTwo.position.y = parseFloat(cylinderOne.position.y);
        cylinderTwo.position.z = parseFloat(cylinderOne.position.z);

        //var indexOne = objects.indexOf(cylinderOne);
        // objects.splice(indexOne, 1);
        //
        //var indexTwo = objects.indexOf(cylinderTwo);
        // objects.splice(indexTwo, 1);

        var outputString = 'O0001 <br/> \
  N5 M12 <br/> \
  N10 T0101 <br/> \
  N15 G0 X100 Z50 <br/> \
  N20 M3 S600 <br/> \
  N25 M8 <br/> \
  N30 G1 X50 Z0 F600 <br/> \
  N40 W-30 F200 <br/> \
  N50 X80 W-20 F150 <br/> \
  N60 G0 X100 Z50 <br/> \
  N70 T0100 <br/> \
  N80 M5 <br/> \
  N90 M9 <br/> \
  N100 M13 <br/> \
  N110 M30 <br/> \
  N120 %';

        //outputString.push('00001');
        //$.fn.write = function (str, delay) {
        //    var len = str.length, i = 0, self = this;
        //
        //    var interval = setInterval(function () {
        //        if (!str[i]) {
        //            clearInterval(interval)
        //        }
        //        else {
        //            self.html(str.substr(0, i++));
        //        }
        //    }, delay || 30);
        //    return self;
        //};

        $('#code').html(outputString);
        $('#sendPost').show();

        return false;
    }

    $(window).resize(function () {
        SCREEN_WIDTH = window.innerWidth;
        SCREEN_HEIGHT = window.innerHeight;

        camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
        camera.updateProjectionMatrix();

        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    });
    animate();

    $('button[name="submitOperationParams"]').click(function (e) {
        e.preventDefault();
        var depthOfCut = $('#depth').val();
        var feedLength = $('#feedLength').val();
        performOperation(depthOfCut, feedLength);
        $('.operationModal-bg').fadeOut();
        $('#operationModal').fadeOut();
        doc.trigger('closeModal');
        return false;
    });

    $('button[name="submitGeoParams"]').click(function (e) {
        e.preventDefault();

        var bottomValue = $('#botRad').val();
        var topValue = $('#topRad').val();
        var height = $('#height').val();

        var materialsResult;
        var color;
        $.ajax({
            url: '/materials',
            dataType: 'json',
            type: 'GET',
            success: function(data) {
                materialsResult = data;
                var mat = $('#material').val();
                switch (mat) {
                    case 'brass': color = materialsResult[0].brass.hexColor; break;
                    case 'c45': color = materialsResult[0].c45.hexColor; break;
                    case 'stainless': color = materialsResult[0].stainless.hexColor; break;

                    default: color = 'ffffff'; break;
                }

                var cylinder = createNewGeometry(bottomValue, topValue, height, color, mat);
                scene.add(cylinder);

                $('.modal-bg').fadeOut();
                $('#modal').fadeOut();
                doc.trigger('closeModal');
                return false;
            }
        });
    });

    function createNewGeometry(radiusBottom, radiusTop, height, color, mat) {
        var geometry = new THREE.CylinderGeometry(radiusBottom, radiusTop, height, 32);
        var material = new THREE.MeshLambertMaterial({color: color});
        var cylinder = new THREE.Mesh(geometry, material);

        cylinder.position.x = height / 2;
        cylinder.position.y = radiusBottom;
        cylinder.position.z = radiusBottom;
        cylinder.rotateZ(Math.PI / 2);

        cylinder.materialName = mat;

        objects.push(cylinder);
        return cylinder;
    }

    $('.createButton').click(function () {
        $('#modal').css('display', 'block');
        $('.modal-bg').fadeIn().find('input').eq(0).focus();
        doc.trigger('openModal');
    });

    $('.clearButton').click(function () {
        objects.forEach(function (element, index, array) {
            scene.remove(element);
        });
        objects.length = 0;
        $('#code').html('Code output');
        $('#sendPost').hide();
        return false;
    });

    $('#close').click(function () {
        $('.modal-bg').fadeOut();
        $('#modal').fadeOut();
        doc.trigger('closeModal');
        return false;
    });

    $('#opClose').click(function () {
        $('.operationModal-bg').fadeOut();
        $('#operationModal').fadeOut();
        doc.trigger('closeModal');
        return false;
    });

    $('#codeClose').click(function () {
        $('.interfaceVisible').fadeOut();
        doc.trigger('closeModal');
        return false;
    });

    $('#latheClose').click(function () {
        $('.interfaceVisible').fadeOut();
        doc.trigger('closeModal');
        return false;
    });

    doc
        .on('openModal', function (e, modal) {
            projector = {};
        })
        .on('closeModal', function (e, modal) {
            projector = new THREE.Projector();
        });

    $('#operationModal').on('click', function(e) {
        e.stopPropagation();
    })
});
